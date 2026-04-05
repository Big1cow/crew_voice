'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// 定义数据类型，确保与数据库字段名一致
interface PublicPost {
  id: string
  category: string
  refined_content: string
  refined_content_en: string
  captain_reply: string
  captain_reply_en: string
  created_at: string
}

export default function Board() {
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchPosts() {
      // 1. 从 public_posts 抓取已发布的数据
      const { data, error } = await supabase
        .from('public_posts')
        .select('*')
        .eq('status', 'published') // 👈 必须匹配你刚才 SQL 补齐的 status 字段
        .order('created_at', { ascending: false })

      if (error) {
        console.error('抓取回音壁失败:', error.message)
      } else {
        setPosts(data || [])
      }
      setLoading(false)
    }

    fetchPosts()
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      <h1 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
        回音壁 / Feedback Board
      </h1>

      <div className="max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center text-slate-500">加载中 / Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-500">暂无公告 / No messages yet.</div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-slate-900 border-l-4 border-blue-500 p-5 rounded-lg shadow-xl hover:border-green-500 transition-colors"
            >
              {/* 分类标签 */}
              <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                {post.category || '📢 综合 / General'}
              </div>

              {/* 精简后的内容 (双语) */}
              <div className="mb-4">
                <p className="text-blue-100 font-medium text-lg leading-relaxed">
                  {post.refined_content}
                </p>
                <p className="text-slate-400 text-sm mt-1 italic">
                  {post.refined_content_en}
                </p>
              </div>

              {/* 船长回复 (双语) */}
              <div className="bg-slate-800/50 p-4 rounded border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👨‍✈️</span>
                  <span className="text-xs font-bold text-green-400 uppercase">Captain's Action</span>
                </div>
                <p className="text-green-50 text-sm leading-relaxed">
                  {post.captain_reply}
                </p>
                <p className="text-slate-500 text-xs mt-2 italic">
                  {post.captain_reply_en}
                </p>
              </div>

              {/* 发布时间 */}
              <div className="mt-4 text-[10px] text-slate-600 text-right">
                {new Date(post.created_at).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}