import React, { useRef, useState } from 'react';
import { UploadCloud, File, Loader, CheckCircle, Database } from 'lucide-react';
import axios from 'axios';

const Sidebar = () => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setStatus(null);

    try {
      const response = await axios.post('http://localhost:8000/api/ingest', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatus({ type: 'success', message: `Processed ${response.data.chunks_processed} chunks from ${file.name}` });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to ingest document.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sidebar">
      <h2><Database size={20} /> Knowledge Base</h2>
      
      <div className="upload-area" onClick={handleUploadClick}>
        {uploading ? (
          <Loader className="lucide-spin" size={32} color="var(--accent-color)" />
        ) : (
          <UploadCloud size={32} color="var(--text-muted)" />
        )}
        <p>{uploading ? 'Processing Document...' : 'Upload Architecture Diagram, Code, or PDF'}</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }}
          accept=".txt,.md,.pdf,.py,.js,.png,.jpg,.jpeg"
        />
      </div>

      {status && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          backgroundColor: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: status.type === 'success' ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {status.type === 'success' && <CheckCircle size={16} />}
          {status.message}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Supported Formats</h3>
        <ul style={{ listStyle: 'none', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> PDF Documents (.pdf)</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> Code Files (.py, .js)</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> Text & Markdown (.txt, .md)</li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><File size={14} /> Diagrams for OCR (.png, .jpg)</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
