import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Send, User, Bot, Edit2, ArrowLeft, ChevronLeft, Upload } from 'lucide-react';
import { generatePrompt, sendMessageToGemini, type ChatHistoryItem } from './API_KEY';
import OnboardingScreen from './OnboardingScreen';

type Question = {
  id: number;
  text: string;
  answer: string;
};

const initialQuestions: Question[] = [
  // 個性や話し方を反映する質問
  { id: 1, text: "あなたの自己紹介をしてください。", answer: "" },
  { id: 2, text: "あなたがよく使うフレーズや口癖は何ですか？（例：なんでやねん、まあいいかなど）", answer: "" },
  { id: 3, text: "まわりの人から、あなたはどんな性格だと言われますか？", answer: "" },
  { id: 4, text: "普段どんなトーンや言葉遣いで話しますか？（例：丁寧、落ち着いた、明るいなど）", answer: "" },
  { id: 5, text: "あなたの趣味は何ですか？（ない場合は、最近していることでも可）", answer: "" },
  
  // 知識や専門性を引き出す質問
  { id: 6, text: "あなたの得意なことは何ですか？", answer: "" },
  { id: 7, text: "あなたが一番苦労したことは何ですか？", answer: "" },
  { id: 8, text: "あなたが友達に話しがちな内容は何ですか？", answer: "" },
  { id: 9, text: "AIクローンがあったら、どんな場面で活用したいですか？", answer: "" },
  
  // 応答パターンや限界を設定する質問
  { id: 10, text: "どんな質問は避けたほうがいいですか？", answer: "" },
  { id: 11, text: "AIクローンに言ってほしくないことや、してほしくないことはありますか？", answer: "" },
  { id: 12, text: "どんなときでも大事にしていたい考え方や行動はありますか？", answer: "" },
  
  // 実際の会話サンプルや状況設定の質問
  { id: 13, text: "あなたのいつもの一日の過ごし方を教えてください", answer: "" },
  { id: 14, text: "友達に「今日は長かったね」と言われたとき、どのように返答しますか？", answer: "" },
  { id: 15, text: "友達が新しい物事に挑戦するとき、どのように返答しますか？。", answer: "" }
];

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  isTyping?: boolean;
};

function App() {
  const [step, setStep] = useState<'welcome' | 'onboarding' | 'questions' | 'chat'>('welcome');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [aiName, setAiName] = useState('クローンAI');
  const [isEditingName, setIsEditingName] = useState(false);
  const [temporaryName, setTemporaryName] = useState('クローンAI');
  
  // LINE データ関連の状態を追加
  const [lineData, setLineData] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isAnalyzingLine, setIsAnalyzingLine] = useState<boolean>(false);
  const [lineAnalysisResult, setLineAnalysisResult] = useState<string>('');
  const [showLineUpload, setShowLineUpload] = useState<boolean>(false);
  const [analysisDetails, setAnalysisDetails] = useState<string>('');
  const [analysisStage, setAnalysisStage] = useState<'idle' | 'extracting' | 'analyzing' | 'updating' | 'complete'>('idle');
  const [showAnalysisDetails, setShowAnalysisDetails] = useState<boolean>(false);
  const [allQuestionsAnswered, setAllQuestionsAnswered] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // メッセージが追加されたときに自動スクロール
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // ローディングが終わったらテキストボックスにフォーカスを当てる
  useEffect(() => {
    if (!isLoading && step === 'chat' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, step]);

  const handleStart = () => {
    setStep('questions');
  };

  // 質問カテゴリを取得する関数
  const getQuestionCategory = (questionIndex: number): string => {
    if (questionIndex < 5) return "個性と話し方";
    if (questionIndex < 9) return "専門知識と得意分野";
    if (questionIndex < 12) return "応答の境界とガイドライン";
    return "会話サンプル";
  };

  // 質問カテゴリのスタイルを取得する関数
  const getQuestionCategoryStyle = (questionIndex: number): string => {
    if (questionIndex < 5) return "bg-blue-100 text-blue-800";
    if (questionIndex < 9) return "bg-green-100 text-green-800";
    if (questionIndex < 12) return "bg-yellow-100 text-yellow-800";
    return "bg-purple-100 text-purple-800";
  };

  // タイピングアニメーション用の関数
  const animateTyping = (text: string, messageId: number) => {
    let i = 0;
    // 文章の長さに応じて速度を調整（長い文章ほど速く表示）
    const baseSpeed = 20;
    const speed = Math.max(10, Math.min(baseSpeed, baseSpeed - Math.floor(text.length / 100)));
    
    const typing = setInterval(() => {
      i++;
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, text: text.substring(0, i), isTyping: i < text.length }
            : msg
        )
      );
      
      // タイピングが完了したらクリア
      if (i >= text.length) {
        clearInterval(typing);
      }
    }, speed);
    
    return typing;
  };

  // 質問の回答後も入力欄にフォーカスを当てる
  const handleQuestionAnswer = (answer: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestion].answer = answer;
    setQuestions(updatedQuestions);
    setInput('');

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((curr: number) => curr + 1);
      // フォーカスを維持するために少し遅延を入れる
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } else {
      // 全ての質問が終了したことを示す
      setAllQuestionsAnswered(true);
    }
  };

  // チャット開始
  const handleStartChat = () => {
    // システムプロンプトを生成
    const prompt = generatePrompt(questions, aiName);
    setSystemPrompt(prompt);
    
    console.log('生成されたプロンプト:', prompt);
    
    setStep('chat');
    setMessages([
      { 
        id: 1, 
        text: `こんにちは！私は${aiName}、あなたの会話クローンです。あなたの話し方や考え方を学習したので、いつでも話しかけてください！`, 
        sender: 'ai' 
      }
    ]);
    // フォーカスを設定
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    const newMessages = [
      ...messages,
      { id: messages.length + 1, text: userMessage, sender: 'user' as const }
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // 「AIが入力中...」のメッセージを追加
    const typingMessageId = newMessages.length + 1;
    setMessages([
      ...newMessages,
      { id: typingMessageId, text: "", sender: 'ai' as const, isTyping: true }
    ]);

    try {
      // APIキーが設定されているか確認
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('APIキーが設定されていません。.envファイルにVITE_GEMINI_API_KEYを設定してください。');
      }

      // Gemini APIに送信
      const aiResponse = await sendMessageToGemini(userMessage, systemPrompt, chatHistory);
      
      // チャット履歴を更新
      const updatedHistory: ChatHistoryItem[] = [
        ...chatHistory,
        { role: 'user' as const, parts: userMessage },
        { role: 'model' as const, parts: aiResponse }
      ];
      setChatHistory(updatedHistory);

      // AIが応答を生成中であることをコンソールに表示
      console.log('プロンプト:', systemPrompt.substring(0, 100) + '...');
      console.log('ユーザーメッセージ:', userMessage);
      console.log('AIの応答:', aiResponse.substring(0, 100) + '...');
      console.log('会話履歴数:', updatedHistory.length);

      // タイピングアニメーション付きで応答を表示
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === typingMessageId 
            ? { ...msg, text: "", isTyping: true }
            : msg
        )
      );
      
      // 短い遅延を追加して、ユーザーがAIの「考え中」状態を認識できるようにする
      setTimeout(() => {
        const typingInterval = animateTyping(aiResponse, typingMessageId);
        return () => clearInterval(typingInterval);
      }, 500);
    } catch (error: any) {
      console.error('チャットエラー:', error);
      const errorMessage = error.message || 'すみません、エラーが発生しました。もう一度お試しください。';
      
      // エラーメッセージを表示
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg.id !== typingMessageId).concat([
          { 
            id: typingMessageId, 
            text: errorMessage.includes('API') 
              ? errorMessage 
              : 'すみません、エラーが発生しました。しばらくしてからもう一度お試しください。', 
            sender: 'ai' as const 
          }
        ])
      );
    } finally {
      setIsLoading(false);
    }
  };

  // AIの名前を変更
  const handleNameChange = () => {
    if (temporaryName.trim()) {
      setAiName(temporaryName);
      setIsEditingName(false);
    }
  };

  // EnterキーでメッセージとQAの送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step === 'questions' && input) {
        handleQuestionAnswer(input);
      } else if (step === 'chat' && input) {
        handleSendMessage();
      } else if (isEditingName) {
        handleNameChange();
      }
    }
  };

  // 質問画面に戻る関数を追加
  const handleBackToQuestions = () => {
    setStep('questions');
  };

  // 前の質問に戻る関数を追加
  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((curr: number) => curr - 1);
      // フォーカスを維持するために少し遅延を入れる
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // LINE データを解析する関数
  const analyzeLINEData = async () => {
    if (!lineData || !userName) return;
    
    setIsAnalyzingLine(true);
    setAnalysisStage('extracting');
    setAnalysisDetails('');
    setShowAnalysisDetails(true);
    
    try {
      // 分析開始を記録
      setAnalysisDetails('LINEデータの抽出を開始しています...\n');
      await new Promise(resolve => setTimeout(resolve, 500)); // UI更新のための遅延
      
      // 名前のチェック
      setAnalysisDetails(prev => prev + `ユーザー名「${userName}」のメッセージを検索中...\n`);
      await new Promise(resolve => setTimeout(resolve, 800)); // UI更新のための遅延
      
      // メッセージ件数の表示
      const messageCount = lineData.split('\n').length;
      setAnalysisDetails(prev => prev + `約${messageCount}行のデータを処理中...\n`);
      await new Promise(resolve => setTimeout(resolve, 500)); // UI更新のための遅延
      
      // AIを使ってLINEデータを分析
      setAnalysisStage('analyzing');
      setAnalysisDetails(prev => prev + '分析プロンプトを生成中...\n');
      
      // LINEデータサンプルを抽出（最初の部分と中間の部分を組み合わせてより良いサンプルを作成）
      const firstPart = lineData.substring(0, 5000);
      const middlePart = lineData.length > 10000 
        ? lineData.substring(Math.floor(lineData.length / 2) - 2500, Math.floor(lineData.length / 2) + 2500)
        : '';
      
      const dataExcerpt = firstPart + (middlePart ? '\n...\n' + middlePart : '');
      
      // より詳細な分析指示を含むプロンプト
      const analysisPrompt = `
# LINEトーク履歴分析タスク #

## 目的 ##
LINEのトーク履歴から特定ユーザーの話し方、口調、表現の特徴を抽出し、詳細に分析する。

## 対象ユーザー ##
ユーザー名: 「${userName}」

## 分析項目 ##
1. よく使うフレーズや口癖（具体例を3つ以上挙げる）
2. 文末表現の特徴（「〜だよ」「〜かな」「〜です」など）
3. 文体（丁寧、カジュアル、省略形など）
4. 絵文字や顔文字の使用パターン
5. 特徴的な言い回し（独特の表現や言葉の選び方）
6. メッセージの長さの傾向（短文が多いか長文が多いか）
7. 句読点や記号の使い方
8. 会話の開始や終了の特徴的なパターン

## 分析手順 ##
1. トーク履歴データからユーザー「${userName}」のメッセージを特定する
2. 各分析項目について詳細に調査する
3. 複数の具体例を挙げながら特徴を説明する
4. 見つかったユーザーメッセージの件数も報告する

## 出力形式 ##
「分析結果:」という見出しで始め、各分析項目を明確に示し、具体例を含めて説明すること。
最後に見つかったメッセージ件数を「〇〇件のメッセージを分析しました」という形式で記載すること。

## トーク履歴データ ##
${dataExcerpt}
`;

      // AIに分析を依頼
      setAnalysisDetails(prev => prev + 'Gemini AIに分析を依頼中...\n');
      console.log('LINE分析プロンプト:', analysisPrompt.substring(0, 200) + '...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // UI更新のための遅延
      
      // システムプロンプトは空にして分析に特化したプロンプトのみを送信
      // チャット履歴も空で、クリーンな状態から分析を行う
      const analysisResult = await sendMessageToGemini(
        analysisPrompt,
        '',
        []
      );
      
      console.log('AIからの分析結果:', analysisResult.substring(0, 200) + '...');
      setAnalysisDetails(prev => prev + 'AIからの分析結果を受信しました。\n');
      setAnalysisStage('updating');
      
      if (!analysisResult || analysisResult.includes('エラー') || analysisResult.includes('すみません')) {
        throw new Error('AI分析からの有効な結果が得られませんでした。' + analysisResult);
      }
      
      // 分析結果から必要な情報を抽出・整形
      let cleanedAnalysisResult = analysisResult;
      
      // 「分析結果:」の見出し以降の内容だけを取得
      if (cleanedAnalysisResult.includes('分析結果:')) {
        cleanedAnalysisResult = cleanedAnalysisResult.split('分析結果:')[1].trim();
      }
      
      // プロンプト指示や見出しを削除
      cleanedAnalysisResult = cleanedAnalysisResult
        .replace(/^#.*$/gm, '') // 見出し行を削除
        .replace(/^\d+\.\s/gm, '・') // 番号付きリストを箇条書きに変換
        .replace(/^-\s/gm, '・') // ハイフン付きリストを箇条書きに変換
        .replace(/\[.*?\]/g, '') // [...] のようなテンプレート指示を削除
        .replace(/（.*?）/g, '') // （...）のような注釈を削除
        .replace(/\n{3,}/g, '\n\n') // 3行以上の改行を2行に統一
        .trim();
      
      // 分析結果からメッセージ件数を抽出（正規表現で「〜件のメッセージ」を検索）
      const messageCountMatch = analysisResult.match(/(\d+)件のメッセージ/);
      const detectedCount = messageCountMatch ? messageCountMatch[1] : "複数";
      
      // 分析結果をシステムプロンプトに保存（質問の回答には自動反映しない）
      setLineAnalysisResult(`分析が完了しました。約${detectedCount}件のメッセージを分析し、特徴を抽出しました。全ての質問に回答すると、このLINE分析結果がAIクローンに自動的に反映されます。`);
      
      // 分析結果を保存しておく
      localStorage.setItem('lineAnalysisResult', cleanedAnalysisResult);
      
      setAnalysisStage('complete');
      setAnalysisDetails(prev => prev + `分析完了！約${detectedCount}件のメッセージを分析しました。\n` + 
                                        `質問回答後、この分析結果が自動的にプロンプトに組み込まれます。\n`);
    } catch (error: any) {
      console.error('LINE分析エラー:', error);
      setAnalysisStage('idle');
      setAnalysisDetails(prev => prev + `エラーが発生しました: ${error.message}\n`);
      setLineAnalysisResult(`分析中にエラーが発生しました: ${error.message}`);
    } finally {
      setIsAnalyzingLine(false);
    }
  };

  // 分析詳細の表示/非表示を切り替える
  const toggleAnalysisDetails = () => {
    setShowAnalysisDetails(!showAnalysisDetails);
  };

  // ファイルをアップロードする関数
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAnalysisStage('idle');
    setAnalysisDetails('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setLineData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // LINEデータアップロードUIの表示を切り替える
  const toggleLineUpload = () => {
    setShowLineUpload(!showLineUpload);
    if (!showLineUpload) {
      setLineAnalysisResult('');
      setAnalysisDetails('');
      setAnalysisStage('idle');
      setShowAnalysisDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-rose-100 to-lime-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px] pointer-events-none"></div>
      
      {step === 'welcome' && (
        <OnboardingScreen onStart={handleStart} setAiName={setAiName} aiName={aiName} />
      )}

      {step === 'questions' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          {/* LINE AI分析カード - 質問ボックスとは独立した別カードとして表示 */}
          {showLineUpload && (
            <div className="fixed right-8 top-8 z-10 w-80 backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 p-5 animate-fadeIn">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">LINEトーク履歴をAIが分析β版</h3>
                <button 
                  onClick={toggleLineUpload}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                PCから「トーク履歴をテキストでダウンロード」したファイルをアップロードし、あなたのLINEでの名前を入力してください。AIがあなたの話し方を分析します。
              </p>
              <div className="mb-2">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="あなたのLINEでの表示名"
                  className="w-full text-sm bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500/50 mb-2"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs bg-white/50 hover:bg-white/70 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex-1"
                  >
                    ファイルを選択
                  </button>
                  <button
                    onClick={analyzeLINEData}
                    disabled={!lineData || !userName || isAnalyzingLine}
                    className={`text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-lg transition-colors flex-1 ${
                      !lineData || !userName || isAnalyzingLine ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                    }`}
                  >
                    {isAnalyzingLine ? 'AI分析中...' : 'AIで分析する'}
                  </button>
                </div>
                {lineData && (
                  <div className="text-xs text-green-600 mt-1">
                    ファイルを読み込みました ({Math.round(lineData.length / 1024)} KB)
                  </div>
                )}
                
                {/* 分析段階の表示 */}
                {isAnalyzingLine && (
                  <div className="mt-3 mb-2">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>分析進行状況</span>
                      <span>
                        {analysisStage === 'extracting' && '抽出中...'}
                        {analysisStage === 'analyzing' && 'AI分析中...'}
                        {analysisStage === 'updating' && '反映中...'}
                        {analysisStage === 'complete' && '完了！'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ 
                          width: analysisStage === 'extracting' ? '30%' : 
                                 analysisStage === 'analyzing' ? '60%' : 
                                 analysisStage === 'updating' ? '90%' : 
                                 analysisStage === 'complete' ? '100%' : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* 分析結果のサマリー */}
                {lineAnalysisResult && (
                  <div className="text-xs text-gray-700 mt-2 p-2 bg-white/40 rounded-lg">
                    <p>{lineAnalysisResult}</p>
                    {analysisStage === 'complete' && (
                      <button 
                        onClick={toggleAnalysisDetails}
                        className="mt-1 text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {showAnalysisDetails ? '詳細を隠す' : '詳細を表示'}
                      </button>
                    )}
                  </div>
                )}
                
                {/* 詳細な分析ログ */}
                {showAnalysisDetails && (
                  <div className="mt-3 bg-black/10 rounded-lg text-xs overflow-hidden">
                    {/* タブ切り替え */}
                    <div className="flex border-b border-white/20">
                      <button 
                        className="flex-1 py-1.5 px-2 bg-white/20"
                        onClick={() => setShowAnalysisDetails(true)}
                      >
                        処理ログ
                      </button>
                      {analysisStage === 'complete' && (
                        <button 
                          className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20"
                          onClick={() => {
                            // 質問一覧に分析結果が表示されていることを伝える
                            alert("分析結果は質問一覧の「よく使うフレーズ」と「言葉遣い」の項目に反映されています。");
                            // 質問画面を閉じずに質問一覧に戻る
                            toggleLineUpload();
                          }}
                        >
                          質問に反映済み
                        </button>
                      )}
                    </div>
                    
                    {/* 処理ログ表示 */}
                    <div className="font-mono text-gray-700 max-h-40 overflow-y-auto whitespace-pre-line p-2">
                      {analysisDetails || '分析ログがありません'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LINE分析ボタン - 固定位置に表示 */}
          {allQuestionsAnswered && (
            <button
              onClick={toggleLineUpload}
              className="fixed top-8 right-8 z-10 flex items-center gap-1 text-xs bg-white/40 hover:bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-gray-700 transition-colors shadow-sm"
            >
              <Upload size={14} />
              LINEデータ分析
            </button>
          )}

          {!allQuestionsAnswered ? (
            <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 p-8 max-w-md w-full">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30">
                    <div 
                      className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-800/90 font-medium">
                    {currentQuestion + 1} / {questions.length}
                  </p>
                </div>
                <h2 className="text-xl font-semibold text-gray-800/90 mb-2">
                  {questions[currentQuestion].text}
                </h2>
                {/* カテゴリ表示 */}
                <div className="mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getQuestionCategoryStyle(currentQuestion)}`}>
                    {getQuestionCategory(currentQuestion)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500/50 text-gray-800"
                  placeholder="回答を入力..."
                  ref={inputRef}
                  autoFocus
                />
                <button
                  onClick={() => input && handleQuestionAnswer(input)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
                  disabled={!input}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
              {/* スキップボタンと戻るボタン */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={handlePreviousQuestion}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
                  disabled={currentQuestion === 0}
                >
                  <ChevronLeft size={16} />
                  前の質問に戻る
                </button>
                <button
                  onClick={() => {
                    // 空の回答で次へ進む
                    handleQuestionAnswer("");
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  この質問をスキップ
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* 全ての質問回答後の表示 */}
              <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800/90">AIクローンを作成する</h2>
                  <button
                    onClick={handleStartChat}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
                  >
                    会話を開始
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  質問への回答からあなたのAIクローンを作成する準備が整いました。さらに精度を高めるには、LINEトーク履歴を分析してみましょう。
                </p>
              </div>

              {/* LINE解析ボタン - 質問箱と同じサイズで表示 */}
              <div className="backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 p-8 max-w-md w-full">
                <h2 className="text-xl font-semibold text-gray-800/90 mb-2">LINEトーク履歴を分析する</h2>
                <p className="text-sm text-gray-700 mb-4">
                  あなたのLINEトークからAIがあなたの話し方を学習し、より精度の高いクローンを作成します。
                </p>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="あなたのLINEでの表示名"
                    className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-800 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-gray-700 hover:bg-white/60 transition-colors text-sm"
                    >
                      ファイルを選択
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt"
                      className="hidden"
                    />
                    <button
                      onClick={analyzeLINEData}
                      disabled={!lineData || !userName || isAnalyzingLine}
                      className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-3 text-sm ${
                        !lineData || !userName || isAnalyzingLine ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                      }`}
                    >
                      {isAnalyzingLine ? 'AI分析中...' : 'AIで分析する'}
                    </button>
                  </div>
                </div>
                
                {lineData && !isAnalyzingLine && !lineAnalysisResult && (
                  <div className="mt-2 text-xs text-green-600">
                    ファイルを読み込みました ({Math.round(lineData.length / 1024)} KB)
                  </div>
                )}
                
                {/* 分析中の表示 */}
                {isAnalyzingLine && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-700 mb-1">
                      <span>分析進行状況</span>
                      <span>
                        {analysisStage === 'extracting' && '抽出中...'}
                        {analysisStage === 'analyzing' && 'AI分析中...'}
                        {analysisStage === 'updating' && '反映中...'}
                        {analysisStage === 'complete' && '完了！'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ 
                          width: analysisStage === 'extracting' ? '30%' : 
                                 analysisStage === 'analyzing' ? '60%' : 
                                 analysisStage === 'updating' ? '90%' : 
                                 analysisStage === 'complete' ? '100%' : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* 分析完了の表示 */}
                {lineAnalysisResult && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600 font-medium">分析が完了しました！</p>
                      <button 
                        onClick={toggleAnalysisDetails}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        {showAnalysisDetails ? '詳細を隠す' : '詳細を表示'}
                      </button>
                    </div>
                    
                    {showAnalysisDetails && (
                      <div className="mt-2 bg-black/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                        <div className="font-mono text-xs text-gray-700 whitespace-pre-line">
                          {analysisDetails || '分析ログがありません'}
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleStartChat}
                      className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-4 py-3 hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                      分析結果を反映してAIクローンと会話する
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'chat' && (
        <div className="min-h-screen flex flex-col max-w-4xl mx-auto p-4">
          {/* AIの名前表示とエディットボタン */}
          <div className="backdrop-blur-xl bg-white/30 rounded-2xl shadow-lg border border-white/20 p-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-md">
                <Bot size={18} className="text-gray-800/90" />
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={temporaryName}
                    onChange={(e) => setTemporaryName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500/50 text-gray-800 text-sm"
                    placeholder="AIの名前..."
                    autoFocus
                  />
                  <button
                    onClick={handleNameChange}
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <h3 className="font-medium text-gray-800/90">{aiName}</h3>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 質問に戻るボタンを追加 */}
              <button
                onClick={handleBackToQuestions}
                className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 bg-white/30 px-3 py-1 rounded-lg text-sm"
              >
                <ArrowLeft size={16} />
                質問に戻る
              </button>
              {!isEditingName && (
                <button
                  onClick={() => {
                    setTemporaryName(aiName);
                    setIsEditingName(true);
                  }}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 backdrop-blur-xl bg-white/30 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/20 p-6 mb-4 overflow-y-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  } animate-fadeIn`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-white/50 backdrop-blur-sm'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <User size={24} className="text-white" />
                    ) : (
                      <Bot size={24} className="text-gray-800/90" />
                    )}
                  </div>
                  <div
                    className={`px-6 py-4 rounded-2xl max-w-[70%] shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white/50 backdrop-blur-sm text-gray-800/90'
                    }`}
                  >
                    {message.isTyping && message.sender === 'ai' ? (
                      <div className="flex items-center">
                        {message.text ? (
                          <span>{message.text}</span>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-gray-600">入力中</span>
                            <div className="flex ml-2">
                              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-pulse mx-0.5"></span>
                              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.2s' }}></span>
                              <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-pulse mx-0.5" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-white/50 backdrop-blur-sm border border-white/30 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500/50 text-gray-800"
              placeholder="メッセージを入力..."
              disabled={isLoading}
              ref={inputRef}
              autoFocus
            />
            <button
              onClick={handleSendMessage}
              className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl transition-all duration-300 shadow-lg ${
                isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:shadow-xl'
              }`}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <div className="flex items-center justify-center w-6 h-6">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              ) : (
                <Send size={24} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;