'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TRANSLATIONS = {
  zh: {
    title: '⚓ 「长」话短说',
    subtitle: '船长直通匿名留言板',
    category: '分类',
    cat_safety: '🚨 安全类',
    cat_improve: '⚙️ 改善类',
    cat_suggest: '💬 建议类',
    content_placeholder: '请描述具体问题。您的身份已加密，仅船长可见原始内容。',
    upload_img: '上传现场照片 (可选)',
    submit: '加密发送给船长',
    loading: '正在发送...',
    success: '提交成功！感谢您为船舶安全做出的贡献。',
    view_board: '查看公开回音壁 →'
  },
  en: {
    title: '⚓ Captain\'s Direct',
    subtitle: 'Anonymous Message Board to Captain',
    category: 'Category',
    cat_safety: '🚨 Safety',
    cat_improve: '⚙️ Improvement',
    cat_suggest: '💬 Suggestion',
    content_placeholder: 'Describe the issue. Your identity is encrypted. Only Captain can read the raw message.',
    upload_img: 'Upload Photo (Optional)',
    submit: 'Send Encrypted to Captain',
    loading: 'Sending...',
    success: 'Submitted! Thank you for your contribution to ship safety.',
    view_board: 'View Public Board →'
  }
}

export default function CrewPage() {
  const [lang, setLang] = useState<'zh' | 'en'>('zh')
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const t = TRANSLATIONS[lang]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    let imageUrl = ''

    try {
      // 1. 如果有图片，先上传到 Storage
      if (file) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}` // 彻底脱敏文件名
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(fileName, file)
        
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      // 2. 写入原始留言表
      const { error: dbError } = await supabase.from('raw_messages').insert({
        category: formData.get('category'),
        content: formData.get('content'),
        image_url: imageUrl,
        status: 'pending'
      })

      if (dbError) throw dbError
      alert(t.success);
      (e.target as HTMLFormElement).reset()
      setFile(null)
    } catch (err) {
      console.error(err)
      alert('Error: ' + (lang === 'zh' ? '提交失败，请检查网络' : 'Submission failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      {/* 语言切换 */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
          className="bg-slate-800 px-4 py-1 rounded-full text-sm border border-slate-700 active:scale-95 transition"
        >
          {lang === 'zh' ? 'English' : '中文'}
        </button>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-blue-400">{t.title}</h1>
          <p className="text-slate-400 text-sm">{t.subtitle}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.category}</label>
            <select name="category" className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 outline-none focus:ring-2 ring-blue-500">
              <option value="🚨 安全类">{t.cat_safety}</option>
              <option value="⚙️ 改善类">{t.cat_improve}</option>
              <option value="💬 建议类">{t.cat_suggest}</option>
            </select>
          </div>

          <div>
            <textarea 
              name="content"
              required
              placeholder={t.content_placeholder}
              className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 h-32 outline-none focus:ring-2 ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{t.upload_img}</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm block w-full text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition shadow-lg active:scale-[0.98]"
          >
            {loading ? t.loading : t.submit}
          </button>
        </form>

        <footer className="text-center">
          <a href="/board" className="text-blue-400 text-sm font-medium hover:underline">
            {t.view_board}
          </a>
        </footer>
      </div>
    </div>
  )
}
