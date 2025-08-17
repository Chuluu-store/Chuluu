'use client';

import { useState, useEffect } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setIsLoggedIn(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('groupId', '68a1a9c4f11a032be07bd44d'); // 기존 그룹 ID 사용

      console.log('Starting upload...');

      const response = await fetch('/api/test-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const resultData = await response.json();
      setResult(resultData);
      console.log('Upload result:', resultData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 p-8">
      <div className="max-w-md mx-auto bg-stone-800 rounded-lg p-6">
        <h1 className="text-2xl font-bold text-white mb-6">테스트 업로드</h1>
        
        {!isLoggedIn ? (
          <div className="space-y-4">
            <h2 className="text-lg text-white mb-4">먼저 로그인하세요</h2>
            <div>
              <label className="block text-stone-300 mb-2">이메일</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                className="w-full p-2 bg-stone-700 text-white rounded"
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-stone-300 mb-2">비밀번호</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full p-2 bg-stone-700 text-white rounded"
                placeholder="password"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              로그인
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-900/50 border border-green-500 rounded text-green-200 mb-4">
              ✅ 로그인됨
            </div>
            
            <div>
              <label className="block text-stone-300 mb-2">파일 선택</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="w-full p-2 bg-stone-700 text-white rounded"
              />
            </div>

            {file && (
              <div className="text-stone-300">
                <p>선택된 파일: {file.name}</p>
                <p>크기: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-2 bg-stone-600 hover:bg-stone-500 disabled:bg-stone-700 text-white rounded transition-colors"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 mt-4">
            {error}
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-900/50 border border-green-500 rounded text-green-200 mt-4">
            <p>✅ 업로드 성공!</p>
            <p>미디어 ID: {result.mediaId}</p>
          </div>
        )}
      </div>
    </div>
  );
}