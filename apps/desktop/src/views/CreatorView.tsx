import React, { useState } from 'react';
import { ipc } from '../ipc/client';
import { useLang } from '../i18n/Lang';

export default function CreatorView() {
  const Lang = useLang();
  const [isAuthed, setIsAuthed] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [filePath, setFilePath] = useState('');

  const handleAuth = async () => {
    const res = await ipc.github.auth();
    if (res.success) { setIsAuthed(true); const r = await ipc.github.getRepos(); setRepos(r); }
  };

  const handlePickFile = async () => {
    const path = await ipc.settings.pickPluginFile();
    if (path) setFilePath(path);
  };

  const handleUpload = async () => {
    if (!selectedRepo || !filePath) { window.alert(Lang.get('creator.missing_fields')); return; }
    const res = await ipc.github.upload(selectedRepo, version, filePath);
    if (res.success) window.alert(res.message);
  };

  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto'}}>
      <h2>{Lang.get('nav.creator')}</h2>
      {!isAuthed ? (
        <button onClick={handleAuth} style={{padding:'10px 20px', background:'#24292e', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>
          {Lang.get('creator.auth_github')}
        </button>
      ) : (
        <div style={{background:'#fff', padding:20, borderRadius:8, border:'1px solid #ddd'}}>
          <h3>{Lang.get('creator.upload_title')}</h3>
          <div style={{marginBottom:15}}>
            <label>{Lang.get('creator.select_repo')}</label>
            <select value={selectedRepo} onChange={e => setSelectedRepo(e.target.value)} style={{width:'100%', padding:8, marginTop:5}}>
              <option value="">-- Select --</option>
              {repos.map((r: any) => <option key={r.name} value={r.name}>{r.full_name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:15}}>
            <label>{Lang.get('creator.version')}</label>
            <input type="text" value={version} onChange={e => setVersion(e.target.value)} style={{width:'100%', padding:8, marginTop:5}} />
          </div>
          <div style={{marginBottom:15}}>
            <label>{Lang.get('creator.file_path')}</label>
            <div style={{display:'flex', gap:10, marginTop:5}}>
              <input type="text" value={filePath} readOnly style={{flex:1, padding:8}} />
              <button onClick={handlePickFile} style={{padding:'8px 15px', cursor:'pointer'}}>{Lang.get('creator.browse')}</button>
            </div>
          </div>
          <button onClick={handleUpload} style={{padding:'10px 20px', background:'#00a8ff', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', width:'100%'}}>
            {Lang.get('creator.upload_btn')}
          </button>
        </div>
      )}
    </div>
  );
}
