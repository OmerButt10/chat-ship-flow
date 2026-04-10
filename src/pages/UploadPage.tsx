import { useState } from 'react';
import api from '@/lib/api';
import { Upload, FileUp, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UploadPage() {
  const [orderId, setOrderId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; url: string; name: string }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || files.length === 0) return;
    // upload to backend
    const fd = new FormData();
    fd.append('order_id', orderId);
    files.forEach((f) => fd.append('files', f));
    api
      .post('/uploads/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        setSubmitted(true);
        setUploadedFiles(res.data.files || []);
        setSelectedIds((res.data.files || []).map((f: any) => f.id));
      })
      .catch((err) => {
        console.error('upload failed', err);
        // keep previous UX simple: mark not submitted
      });
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Labels</h1>
        <p className="text-muted-foreground">Attach FBA and box labels to your orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" /> Label Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Check className="h-6 w-6 text-success" />
              </div>
              <p className="font-semibold">Labels uploaded successfully!</p>
              <p className="text-sm text-muted-foreground">
                {files.length} file(s) attached to order {orderId}
              </p>
              <Button variant="outline" onClick={() => { setSubmitted(false); setOrderId(''); setFiles([]); }}>
                Upload More
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Order ID</Label>
                <Input
                  placeholder="e.g., WH-1001"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Label Files</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer space-y-2">
                    <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG (max 10MB)</p>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="space-y-1">
                    {files.map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">📎 {f.name}</p>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={!orderId || files.length === 0}>
                Upload Labels
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      {submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedFiles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files uploaded.</p>
            ) : (
              <div className="space-y-2">
                {uploadedFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(f.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds((s) => [...s, f.id]);
                          else setSelectedIds((s) => s.filter((id) => id !== f.id));
                        }}
                      />
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                        {f.name}
                      </a>
                    </label>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      // merge selected files
                      if (!orderId || selectedIds.length === 0) return;
                      api
                        .post(`/orders/${orderId}/merge-labels/`, { file_ids: selectedIds })
                        .then((res) => {
                          setMergedUrl(res.data.url);
                        })
                        .catch((err) => {
                          console.error('merge failed', err);
                        });
                    }}
                    disabled={selectedIds.length === 0}
                  >
                    Merge Selected
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitted(false);
                      setOrderId('');
                      setFiles([]);
                      setUploadedFiles([]);
                      setSelectedIds([]);
                      setMergedUrl(null);
                    }}
                  >
                    Upload More
                  </Button>
                </div>
                {mergedUrl && (
                  <div className="pt-4">
                    <a href={mergedUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                      Open merged PDF
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
