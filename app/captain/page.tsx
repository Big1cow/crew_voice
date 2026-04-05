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

  // 获取所有待处理的原始留言
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('raw_messages')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (!error) setMessages(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [])

  // 处理发布逻辑
  const handlePublish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const refinedData = {
      raw_id: editingMsg.id,
      category: editingMsg.category,
      refined_content: formData.get('refined_cn'),
      refined_content_en: formData.get('refined_en'),
      captain_reply: formData.get('reply_cn'),
      captain_reply_en: formData.get('reply_en'),
    }

    // 1. 插入公开表
    const { error: pubError } = await supabase.from('public_posts').insert([refinedData])
    
    if (!pubError) {
      // 2. 更新原始表状态为已发布
      await supabase.from('raw_messages').update({ status: 'published' }).eq('id', editingMsg.id)
      alert('已精简发布至回音壁！')
      setEditingMsg(null)
      fetchMessages()
    } else {
      alert('发布失败，请检查数据库字段')
    }
  }

  if (loading) return <div className="p-10 text-white">加载中...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-8 flex items-center gap-2">
        👨‍✈️ 船长管理后台 <span className="text-sm font-normal text-slate-500">Captain Console</span>
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 左侧：原始留言列表 */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase">待处理留言 / Pending</h2>
          {messages.map(msg => (
            <div 
              key={msg.id} 
              onClick={() => setEditingMsg(msg)}
              className={`p-4 rounded-xl border cursor-pointer transition ${editingMsg?.id === msg.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-800 bg-slate-900 hover:bg-slate-800'}`}
            >
              <div className="flex justify-between text-xs mb-2">
                <span className="text-blue-400 font-bold">{msg.category}</span>
                <span className="text-slate-500">{new Date(msg.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm line-clamp-3">{msg.content}</p>
              {msg.image_url && <span className="text-[10px] bg-slate-700 px-1 rounded mt-2 inline-block">有附件图片</span>}
            </div>
          ))}
        </div>

        {/* 右侧：精简发布编辑器 */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit sticky top-8">
          {editingMsg ? (
            <form onSubmit={handlePublish} className="space-y-4">
              <h3 className="text-orange-400 font-bold text-sm">正在处理原始留言：</h3>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-sm text-slate-400 mb-6">
                {editingMsg.content}
                {editingMsg.image_url && (
                  <a href={editingMsg.image_url} target="_blank" className="block mt-2 text-blue-500 underline text-xs">查看原始图片</a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">精简内容 (中)</label>
                  <input name="refined_cn" required className="w-full bg-slate-800 p-2 rounded text-sm" placeholder="如：关于机舱漏油隐患" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-500">Refined (En)</label>
                  <input name="refined_en" required className="w-full bg-slate-800 p-2 rounded text-sm" placeholder="e.g. Engine room oil leak" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500">船长回复 (中)</label>
                <textarea name="reply_cn" required className="w-full bg-slate-800 p-2 rounded text-sm h-20" placeholder="说明处理结果..." />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-500">Captain's Reply (En)</label>
                <textarea name="reply_en" required className="w-full bg-slate-800 p-2 rounded text-sm h-20" placeholder="Action taken..." />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-green-600 py-3 rounded-xl font-bold">精简并公开发布</button>
                <button type="button" onClick={() => setEditingMsg(null)} className="px-4 bg-slate-700 rounded-xl text-sm">取消</button>
              </div>
            </form>
          ) : (
            <div className="py-20 text-center text-slate-600 italic">请在左侧选择一条留言进行处理</div>
          )}
        </div>
      </div>
    </div>
  )
}