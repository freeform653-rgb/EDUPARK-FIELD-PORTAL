import React, { useState, useRef, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { useApp } from '../../context/AppContext';
import { StorageService, STANDARD_BATCHES } from '../../lib/storage';
import {
  ParsedStudentRow,
  parseExcelBuffer,
  parsePdfBuffer,
  downloadSampleExcelTemplate
} from '../../lib/import-utils';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Download,
  Users,
  RefreshCw,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { students, refreshData, showToast } = useApp();

  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'excel' | 'pdf' | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [defaultBatch, setDefaultBatch] = useState<string>(STANDARD_BATCHES[0]);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set of existing student names in lowercase for fast duplicate detection
  const existingNamesSet = useMemo(() => {
    return new Set(students.map(s => s.full_name.trim().toLowerCase()));
  }, [students]);

  // Reset state when closing/opening
  const handleClose = () => {
    setFile(null);
    setFileType(null);
    setParsedRows([]);
    setParseError(null);
    setIsParsing(false);
    setIsImporting(false);
    onClose();
  };

  // Process uploaded file (Excel or PDF)
  const processFile = async (selectedFile: File, batchToUse: string = defaultBatch) => {
    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);
    setParsedRows([]);

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();

    try {
      const buffer = await selectedFile.arrayBuffer();

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        setFileType('excel');
        const rows = parseExcelBuffer(buffer, batchToUse, existingNamesSet);
        if (rows.length === 0) {
          setParseError('No student records found in the uploaded Excel file. Please ensure there is a "Name" column.');
        } else {
          setParsedRows(rows);
        }
      } else if (ext === 'pdf') {
        setFileType('pdf');
        const rows = await parsePdfBuffer(buffer, batchToUse, existingNamesSet);
        if (rows.length === 0) {
          setParseError('Could not extract any student records from this PDF. Please ensure the PDF contains readable text.');
        } else {
          setParsedRows(rows);
        }
      } else {
        setParseError('Unsupported file format. Please upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file.');
      }
    } catch (err: any) {
      console.error('File parsing error', err);
      setParseError(err.message || 'Failed to read the file. Please check the file format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Re-parse or update default batch across rows that use default
  const handleDefaultBatchChange = (newBatch: string) => {
    setDefaultBatch(newBatch);
    if (file) {
      // Re-parse with the new default batch
      processFile(file, newBatch);
    }
  };

  // Row update helpers
  const toggleRowSelected = (id: string) => {
    setParsedRows(prev =>
      prev.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setParsedRows(prev =>
      prev.map(r => ({ ...r, selected: checked && r.isValid }))
    );
  };

  const updateRowField = (id: string, field: 'full_name' | 'batch' | 'phone_number', value: string) => {
    setParsedRows(prev =>
      prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          if (field === 'full_name') {
            updated.isValid = value.trim().length >= 2;
            updated.isDuplicate = existingNamesSet.has(value.trim().toLowerCase());
          }
          return updated;
        }
        return r;
      })
    );
  };

  const deleteRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  // Stats
  const selectedCount = parsedRows.filter(r => r.selected && r.isValid).length;
  const duplicateCount = parsedRows.filter(r => r.isDuplicate).length;
  const validCount = parsedRows.filter(r => r.isValid).length;

  // Execute bulk import
  const handleImportSubmit = async () => {
    const toImport = parsedRows.filter(r => r.selected && r.isValid);
    if (toImport.length === 0) {
      showToast('Please select at least one valid student to import.', 'warning');
      return;
    }

    setIsImporting(true);
    try {
      const payload = toImport.map(r => ({
        full_name: r.full_name.trim(),
        batch: r.batch.trim(),
        phone_number: r.phone_number?.trim() || null
      }));

      await StorageService.createStudentsBulk(payload);
      await refreshData();
      showToast(`Successfully imported ${payload.length} students!`, 'success');
      handleClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to import students. Please try again.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Students"
      subtitle="Upload an Excel (.xlsx, .xls, .csv) or PDF (.pdf) file to import students in bulk"
      maxWidth="3xl"
    >
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Step 1: Upload Dropzone & Sample Download */}
        {!file && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-skyblue-500 bg-skyblue-50/60 scale-[1.01]'
                  : 'border-slate-300 hover:border-skyblue-400 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, .pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 flex items-center justify-center text-skyblue-600 gap-1.5">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  <FileText className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (<strong className="font-semibold text-slate-700">.xlsx, .xls</strong>), CSV (<strong className="font-semibold text-slate-700">.csv</strong>), or PDF (<strong className="font-semibold text-slate-700">.pdf</strong>)
                  </p>
                </div>
              </div>
            </div>

            {/* Default Batch Option & Sample Template Download */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-skyblue-600 shrink-0" />
                <span className="font-semibold text-slate-700">Default Batch:</span>
                <select
                  value={defaultBatch}
                  onChange={(e) => handleDefaultBatchChange(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-skyblue-500"
                >
                  {STANDARD_BATCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <span className="text-slate-400 text-[11px] hidden md:inline">
                  (Applied when a row does not specify a batch)
                </span>
              </div>

              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Sample Excel</span>
              </button>
            </div>
          </div>
        )}

        {/* Parsing Indicator */}
        {isParsing && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-600 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-skyblue-600" />
            <p className="text-sm font-semibold text-slate-800">Reading and parsing file contents...</p>
            <p className="text-xs text-slate-400">Extracting student names, cohorts, and contact numbers</p>
          </div>
        )}

        {/* Error Banner */}
        {parseError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Failed to process file</p>
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {/* Step 2: Parsed Table Preview */}
        {file && !isParsing && parsedRows.length > 0 && (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${fileType === 'excel' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {fileType === 'excel' ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • {parsedRows.length} rows detected
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Batch:</span>
                  <select
                    value={defaultBatch}
                    onChange={(e) => handleDefaultBatchChange(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold"
                  >
                    {STANDARD_BATCHES.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedRows([]);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Remove and select another file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary statistics chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                Total: <strong>{parsedRows.length}</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Selected to Import: <strong>{selectedCount}</strong>
              </span>
              {duplicateCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{duplicateCount} Already Registered (Unchecked)</span>
                </span>
              )}
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 z-10 text-slate-700 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded text-skyblue-600 focus:ring-skyblue-500"
                        />
                      </th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3 w-40">Batch</th>
                      <th className="py-2.5 px-3 w-36">Phone Number</th>
                      <th className="py-2.5 px-3 w-28 text-center">Status</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map(row => (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          !row.selected ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            disabled={!row.isValid}
                            onChange={() => toggleRowSelected(row.id)}
                            className="rounded text-skyblue-600 focus:ring-skyblue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.full_name}
                            onChange={(e) => updateRowField(row.id, 'full_name', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-skyblue-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={row.batch}
                            onChange={(e) => updateRowField(row.id, 'batch', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:ring-1 focus:ring-skyblue-500"
                          >
                            {STANDARD_BATCHES.map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                            {!STANDARD_BATCHES.includes(row.batch) && (
                              <option value={row.batch}>{row.batch}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={row.phone_number || ''}
                            placeholder="Optional"
                            onChange={(e) => updateRowField(row.id, 'phone_number', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 font-mono focus:ring-1 focus:ring-skyblue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isDuplicate ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Duplicate
                            </span>
                          ) : row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteRow(row.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove row"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Choose another file
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleImportSubmit}
              disabled={selectedCount === 0 || isImporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-skyblue-600 hover:bg-skyblue-700 shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Importing Students...</span>
                </>
              ) : (
                <>
                  <span>Import {selectedCount} Students</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ImportStudentsModal;
