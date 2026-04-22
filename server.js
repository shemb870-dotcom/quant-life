import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabaseConfigured = supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin.html', express.static(path.join(__dirname, 'admin.html')));

const upload = multer({ storage: multer.memoryStorage() });

const verifyPassword = (req, res, next) => {
    const auth = req.headers.authorization;
    if (auth === 'Bearer tjx20070827') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

function requireSupabase(res) {
    if (!supabase) {
        res.status(503).json({
            error: 'Supabase 未配置。请在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY，或部署到 Vercel 时在环境变量中配置。'
        });
        return false;
    }
    return true;
}

app.get('/api/posts', async (req, res) => {
    if (!requireSupabase(res)) return;
    try {
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (postsError) throw postsError;

        const { data: files, error: filesError } = await supabase
            .from('post_files')
            .select('*');
        if (filesError) throw filesError;

        const filesByPostId = {};
        for (const f of files) {
            if (!filesByPostId[f.post_id]) filesByPostId[f.post_id] = [];
            filesByPostId[f.post_id].push(f);
        }

        res.json(posts.map(post => ({
            ...post,
            files: filesByPostId[post.id] || []
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts', verifyPassword, async (req, res) => {
    if (!requireSupabase(res)) return;
    try {
        const { title, content, code, code_type } = req.body;
        const { data, error } = await supabase
            .from('posts')
            .insert([{
                title,
                content,
                code,
                code_type: code_type || 'python',
                created_at: new Date().toISOString()
            }])
            .select();
        if (error) throw error;
        res.json(data[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/upload', verifyPassword, upload.single('file'), async (req, res) => {
    if (!requireSupabase(res)) return;
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error } = await supabase.storage
            .from('uploads')
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        res.json({ url: publicUrl, name: req.file.originalname });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts/:id/files', verifyPassword, async (req, res) => {
    if (!requireSupabase(res)) return;
    try {
        const { files } = req.body;
        const postId = req.params.id;
        for (const file of files) {
            const { error } = await supabase
                .from('post_files')
                .insert([{
                    post_id: postId,
                    url: file.url,
                    name: file.name,
                    type: file.type
                }]);
            if (error) throw error;
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/posts/:id', verifyPassword, async (req, res) => {
    if (!requireSupabase(res)) return;
    try {
        const { error: filesError } = await supabase
            .from('post_files')
            .delete()
            .eq('post_id', req.params.id);
        if (filesError) throw filesError;

        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!supabaseConfigured) {
        console.log('\n⚠️  Supabase 未配置！API 将返回 503 错误。');
        console.log('请创建 .env 文件并填入：');
        console.log('  SUPABASE_URL=https://你的项目.supabase.co');
        console.log('  SUPABASE_ANON_KEY=你的anon_key\n');
    }
});
