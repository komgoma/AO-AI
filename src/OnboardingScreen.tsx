import React, { useState } from 'react';
import { ArrowRight, Github, Calendar, Info, UserPlus, Code, RefreshCw } from 'lucide-react';

type OnboardingProps = {
  onStart: () => void;
  setAiName: (name: string) => void;
  aiName: string;
};

// アップデート情報
const updates = [
  { version: "0.2.0", date: "2025/4/24", changes: ["LINE会話データ分析機能の追加", "会話スタイルの自動検出", "分析結果をAIクローンに反映する機能", "会話UIの改善"] },
  { version: "0.1.0", date: "2025/4/17", changes: ["プロジェクト初期構築", "AIクローン基本機能実装", "質問リスト（15項目）設計", "オンボーディング画面の追加"] }
];

const OnboardingScreen: React.FC<OnboardingProps> = ({ onStart, setAiName, aiName }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'updates'>('about');

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-rose-100 to-lime-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px] pointer-events-none"></div>
      
      {/* デザイン要素 */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full opacity-20 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-pink-400 to-orange-300 rounded-full opacity-20 blur-3xl"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-5xl mx-auto backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 overflow-hidden">
          {/* ヒーローセクション */}
          <div className="p-8 md:p-12 text-center">
            <div className="inline-block p-3 bg-white/30 backdrop-blur-sm rounded-2xl mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-2 text-sm font-medium">
                課題研究プロジェクト
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              AI会話クローン
            </h1>
            <p className="text-gray-800/90 text-lg md:text-xl mb-8 max-w-3xl mx-auto">
              あなたの個性を反映したAIクローンを作成し、まるであなた自身が話しているかのような自然な対話を実現します。
            </p>
            
            {/* タブナビゲーション */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm p-1 rounded-xl inline-flex">
                <button 
                  onClick={() => setActiveTab('about')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'about' 
                      ? 'bg-white/80 text-gray-800 shadow-sm' 
                      : 'text-gray-700 hover:bg-white/40'
                  }`}
                >
                  <Info size={16} className="inline mr-1" />
                  アプリ情報
                </button>
                <button 
                  onClick={() => setActiveTab('updates')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'updates' 
                      ? 'bg-white/80 text-gray-800 shadow-sm' 
                      : 'text-gray-700 hover:bg-white/40'
                  }`}
                >
                  <RefreshCw size={16} className="inline mr-1" />
                  更新履歴
                </button>
              </div>
            </div>
            
            {/* タブコンテンツ */}
            <div className="mb-8">
              {activeTab === 'about' && (
                <div className="animate-fadeIn">
                  <div className="grid md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                        <UserPlus size={24} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">パーソナライズドAI</h3>
                      <p className="text-gray-700">
                        質問に答えることであなたの個性を学習し、話し方や考え方を模倣するAIクローンを作成します。
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center mb-4">
                        <Code size={24} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">先進技術</h3>
                      <p className="text-gray-700">
                        Google Gemini 2.0 Flashを活用し、高度な自然言語処理と文脈理解能力を実現しています。
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                        <Github size={24} className="text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">オープンソースの予定？？</h3>
                      <p className="text-gray-700">
                        React、TypeScript、TailwindCSSをベースに構築。
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'updates' && (
                <div className="animate-fadeIn">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl overflow-hidden">
                    {updates.map((update, index) => (
                      <div key={index} className={`p-6 ${index !== updates.length - 1 ? 'border-b border-white/30' : ''}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold">バージョン {update.version}</h3>
                            <p className="text-gray-600 text-sm flex items-center">
                              <Calendar size={14} className="mr-1" /> {update.date}
                            </p>
                          </div>
                          <span className={`
                            text-xs px-2 py-1 rounded-full 
                            ${index === 0 ? 'bg-green-100 text-green-800' : 
                              index === 1 ? 'bg-blue-100 text-blue-800' : 
                              'bg-purple-100 text-purple-800'}
                          `}>
                            {index === 0 ? '最新' : index === 1 ? '安定版' : '初期リリース'}
                          </span>
                        </div>
                        <ul className="text-gray-700 text-sm">
                          {update.changes.map((change, i) => (
                            <li key={i} className="mb-1 flex items-start">
                              <span className="mr-2 text-purple-500">•</span> {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* AIの名前入力とスタートボタン */}
            <div className="max-w-md mx-auto">
              <div className="bg-white/30 backdrop-blur-sm p-6 rounded-2xl">
                <label className="block text-gray-800/90 mb-2 font-medium">AIクローンの名前</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500/50 text-gray-800 mb-4"
                  placeholder="AIの名前を入力..."
                />
                <button
                  onClick={onStart}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                >
                  AIクローンを作成する
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
          
          {/* フッター */}
          <div className="px-8 py-4 bg-black/5 backdrop-blur-sm border-t border-white/10 text-center text-gray-600 text-sm">
            © 2025 AI会話クローン | 課題研究プロジェクト | <a href="#" className="text-purple-600 hover:underline">利用規約</a> | <a href="#" className="text-purple-600 hover:underline">プライバシーポリシー</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen; 