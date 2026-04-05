'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CaptainPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMsg, setEditingMsg] = useState<any>(null)
  // 新增：切换查看“待处理”或“已处理”留言
  const [viewMode, setViewMode] = useState<'pending' | 'published'>('pending')

  // 获取原始留言
  const fetchMessages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('raw_messages')
      .select('*')
      .eq('status', viewMode) // 根据当前模式筛选
      .order('created_at', { ascending: false })
    
    if (!error) setMessages(data || [])
    setLoading(false)
  }

  // 当切换 viewMode 时自动刷新列表
  useEffect(() => {
    fetchMessages()
  }, [viewMode])

  // 处理发布逻辑
  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    // 准备发布到回音壁的数据，显式加入时间戳
    const refinedData = {
      raw_id: editingMsg.id,
      category: editingMsg.category,
      refined_content: formData.get('refined_cn'),
      refined_content_en: formData.get('refined_en'),
      captain_reply: formData.get('reply_cn'),
      captain_reply_en: formData.get('reply_en'),
      status: 'published',
      created_at: new Date().toISOString() // 记录发布时间
    }

    // 1. 插入公开表 public_posts
    const { error: pubError } = await supabase.from('public_posts').insert([refinedData])
    
    if (!pubError) {
      // 2. 更新原始表状态为已发布 (published)
      await supabase.from('raw_messages').update({ status: 'published' }).eq('id', editingMsg.id)
      alert(`编号 #${editingMsg.display_id} 的留言已成功处理并发布！`)
      setEditingMsg(null)
      fetchMessages()
    } else {
      alert('发布失败，请检查数据库字段是否匹配')
    }
  }

  if (loading && messages.length === 0) return <div className="p-10 text-white italic">加载中...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          👨‍✈️ 船长管理后台 <span className="text-sm font-normal text-slate-500 font-mono">Captain Console</span>
        </h1>
        
        {/* 模式切换开关 */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setViewMode('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            待处理 (Pending)
          </button>
          <button 
            onClick={() => setViewMode('published')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'published' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            已处理 (Processed)
          </button>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 左侧：原始留言列表 */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex justify-between">
            <span>{viewMode === 'pending' ? '收件箱' : '已归档'}</span>
            <span className="font-mono text-blue-500">{messages.length} 条</span>
          </h2>
          
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                onClick={() => setEditingMsg(msg)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-lg ${
                  editingMsg?.id === msg.id 
                    ? 'border-blue-500 bg-blue-900/30' 
                    : 'border-slate-800 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {/* 显示数据库自动生成的 display_id 编号 */}
                    <span className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">
                      #{msg.display_id}
                    </span>
                    <span className="text-blue-400 font-bold text-xs">{msg.category}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{new Date(msg.created_at).toLocaleString('zh-CN', { hour12: false })}</span>
                </div>
                <p className="text-sm text-slate-300 line-clamp-3 italic">"{msg.content}"</p>
                {msg.image_url && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-green-500 font-bold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    附带现场图片
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：精简发布编辑器 */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit sticky top-8 shadow-2xl">
          {editingMsg ? (
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-orange-400 font-bold text-sm">正在处理：#{editingMsg.display_id}</h3>
                {viewMode === 'published' && <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800">该留言已处理</span>}
              </div>
              
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-400 leading-relaxed max-h-40 overflow-y-auto mb-6">
                <span className="text-[10px] text-slate-600 block mb-1 uppercase font-bold">原始诉求 / Original:</span>
                {editingMsg.content}
                {editingMsg.image_url && (
                  <a href={editingMsg.image_url} target="_blank" className="block mt-3 text-blue-500 hover:text-blue-400 underline text-xs transition">
                    查看附件图片 ↗
                  </a>
                )}
              </div>

              {/* 编辑区域仅在待处理模式下显示更合理，但此处保留以供重新编辑需求 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">精简内容 (CN)</label>
                  <input name="refined_cn" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm focus:border-blue-500 outline-none transition" placeholder="如：关于伙食质量改善" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Refined (EN)</label>
                  <input name="refined_en" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm focus:border-blue-500 outline-none transition" placeholder="e.g. Catering improvement" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">船长回复 (CN)</label>
                <textarea name="reply_cn" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm h-24 focus:border-green-500 outline-none transition resize-none" placeholder="详细说明处理结果..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Captain's Reply (EN)</label>
                <textarea name="reply_en" required className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-sm h-24 focus:border-green-500 outline-none transition resize-none" placeholder="Action taken..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100" disabled={viewMode === 'published'}>
                  {viewMode === 'published' ? '已发布存档' : '精简并公开发布'}
                </button>
                <button type="button" onClick={() => setEditingMsg(null)} className="px-6 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-medium transition">
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="py-24 text-center">
              <div className="text-4xl mb-4 opacity-20">📥</div>
              <p className="text-slate-600 italic text-sm">请在左侧选择一条留言开始处理</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}