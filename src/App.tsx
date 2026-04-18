/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  Trophy, 
  Wallet, 
  History as HistoryIcon, 
  Home, 
  Search, 
  Smartphone, 
  ChevronRight, 
  Plus, 
  X, 
  CheckCircle2, 
  TrendingUp,
  Flame,
  Clock,
  Zap,
  BrainCircuit,
  Loader2,
  Settings,
  User,
  Bell,
  Globe,
  Shield,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getMatchAnalysis, getGlobalPrediction } from './services/geminiService';

// --- Types ---

interface Match {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  time: string;
  date: string;
  isLive?: boolean;
  score?: { home: number; away: number };
  isVIP?: boolean;
  vipRank?: number;
  aiExplanation?: string;
  probabilities?: {
    home: number;
    draw: number;
    away: number;
  };
  lineups?: {
    home: string[];
    away: string[];
  };
}

interface SavedMatch {
  matchId: string;
  matchName: string;
  league: string;
  time: string;
}

// --- Mock Data ---

const MOCK_MATCHES: Match[] = [
  {
    id: 'ucl-1',
    league: 'Champions League',
    homeTeam: 'Manchester City',
    awayTeam: 'Real Madrid',
    homeLogo: 'https://cdn.worldvectorlogo.com/logos/manchester-city-fc.svg',
    awayLogo: 'https://cdn.worldvectorlogo.com/logos/real-madrid-c-f.svg',
    time: '22:00',
    date: '17/04/2026',
    isVIP: true,
    vipRank: 1,
    aiExplanation: "Hii ni mechi ya marudiano robo fainali. Baada ya sare ya 3-3 katika mkondo wa kwanza, City wana faida ya nyumbani ambapo hawajashindwa kwa muda mrefu. Real Madrid wanategemea mashambulizi ya kushtukiza kupitia Vinícius na Rodrygo.",
    probabilities: { home: 55, draw: 25, away: 20 },
    lineups: {
      home: ['Ederson', 'Walker', 'Akanji', 'Dias', 'Gvardiol', 'Rodri', 'Kovacic', 'De Bruyne', 'Bernardo', 'Foden', 'Haaland'],
      away: ['Lunin', 'Carvajal', 'Nacho', 'Rudiger', 'Mendy', 'Camavinga', 'Kroos', 'Valverde', 'Bellingham', 'Rodrygo', 'Vinicius']
    }
  },
  {
    id: 'ucl-2',
    league: 'Champions League',
    homeTeam: 'Bayern Munich',
    awayTeam: 'Arsenal',
    homeLogo: 'https://cdn.worldvectorlogo.com/logos/bayern-munchen-logo.svg',
    awayLogo: 'https://cdn.worldvectorlogo.com/logos/arsenal-fc.svg',
    time: '22:00',
    date: '17/04/2026',
    isVIP: true,
    vipRank: 2,
    aiExplanation: "Baada ya mkondo wa kwanza kumalizika 2-2 Emirates, Bayern wanarudi nchini Ujerumani wakiwa na hali mpya. Arsenal wanahitaji kuwa imara kuzuia kasi ya Leroy Sané na ufundi wa Harry Kane.",
    probabilities: { home: 48, draw: 27, away: 25 },
    lineups: {
      home: ['Neuer', 'Kimmich', 'Dier', 'De Ligt', 'Mazraoui', 'Laimer', 'Goretzka', 'Sane', 'Musiala', 'Guerreiro', 'Kane'],
      away: ['Raya', 'White', 'Saliba', 'Gabriel', 'Tomiyasu', 'Jorginho', 'Rice', 'Odegaard', 'Saka', 'Martinelli', 'Havertz']
    }
  },
  {
    id: 'nbc-1',
    league: 'NBC Premier League',
    homeTeam: 'Coastal Union',
    awayTeam: 'Singida Fountain Gate',
    homeLogo: 'https://picsum.photos/seed/coastal/100/100',
    awayLogo: 'https://picsum.photos/seed/singida/100/100',
    time: '16:00',
    date: '17/04/2026',
    probabilities: { home: 45, draw: 30, away: 25 }
  },
  {
    id: 'nbc-2',
    league: 'NBC Premier League',
    homeTeam: 'Mtibwa Sugar',
    awayTeam: 'Mashujaa FC',
    time: '14:00',
    date: '17/04/2026',
    probabilities: { home: 40, draw: 35, away: 25 }
  },
  {
    id: 'uel-1',
    league: 'Europa League',
    homeTeam: 'AS Roma',
    awayTeam: 'AC Milan',
    time: '22:00',
    date: '18/04/2026',
    isVIP: true,
    vipRank: 1,
    aiExplanation: "Roma wanatetea ushindi wao wa 1-0 waliopata San Siro. De Rossi amebadilisha falsafa ya timu kuwa ya kushambulia zaidi. Milan wanahitaji goli la mapema ili kurudi mchezoni.",
    probabilities: { home: 35, draw: 30, away: 35 },
    lineups: {
      home: ['Svilar', 'Celik', 'Mancini', 'Smalling', 'Spinazzola', 'Paredes', 'Cristante', 'Pellegrini', 'Dybala', 'El Shaarawy', 'Lukaku'],
      away: ['Maignan', 'Calabria', 'Gabbia', 'Tomori', 'Theo', 'Bennacer', 'Reijnders', 'Pulisic', 'Loftus-Cheek', 'Leao', 'Giroud']
    }
  },
  {
    id: 'uel-2',
    league: 'Europa League',
    homeTeam: 'Atalanta',
    awayTeam: 'Liverpool',
    time: '22:00',
    date: '18/04/2026',
    isVIP: true,
    vipRank: 2,
    aiExplanation: "Baada ya kipigo kizito cha 3-0 nyumbani Anfield, Liverpool wanahitaji 'miracle' nyingine nchini Italia. Atalanta ni timu iliyopangwa vizuri na ni ngumu kufunga mabao mengi kwao.",
    probabilities: { home: 30, draw: 25, away: 45 },
    lineups: {
      home: ['Musso', 'Djimsiti', 'Hien', 'Kolasinac', 'Zappacosta', 'De Roon', 'Ederson', 'Ruggeri', 'Koopmeiners', 'Pasalic', 'Scamacca'],
      away: ['Alisson', 'Alexander-Arnold', 'Konate', 'Van Dijk', 'Robertson', 'Mac Allister', 'Szoboszlai', 'Jones', 'Salah', 'Jota', 'Diaz']
    }
  },
  {
    id: 'uel-3',
    league: 'Europa League',
    homeTeam: 'West Ham',
    awayTeam: 'Bayer Leverkusen',
    time: '22:00',
    date: '18/04/2026',
    aiExplanation: "Mabingwa wapya wa Bundesliga, Leverkusen, wanakuja London wakiwa na ushindi wa 2-0. Rekodi yao ya kutofungwa msimu huu ni tishio kubwa kwa West Ham.",
    probabilities: { home: 25, draw: 25, away: 50 }
  },
  {
    id: 'fac-1',
    league: 'FA Cup',
    homeTeam: 'Manchester City',
    awayTeam: 'Chelsea',
    time: '19:15',
    date: '20/04/2026',
    isVIP: true,
    vipRank: 1,
    aiExplanation: "Nusu Fainali ya FA Cup Wembley. City wanatafuta kutetea taji lao. Chelsea wako kwenye fomu nzuri hivi karibuni hasa kupitia Cole Palmer ambaye atakutana na timu yake ya zamani.",
    probabilities: { home: 60, draw: 20, away: 20 },
    lineups: {
      home: ['Ortega', 'Walker', 'Dias', 'Akanji', 'Ake', 'Rodri', 'Bernardo', 'De Bruyne', 'Foden', 'Grealish', 'Haaland'],
      away: ['Petrovic', 'Gusto', 'Chalobah', 'Silva', 'Cucurella', 'Caicedo', 'Fernandez', 'Gallagher', 'Palmer', 'Madueke', 'Jackson']
    }
  },
  {
    id: 'ser-1',
    league: 'Serie A',
    homeTeam: 'Juventus',
    awayTeam: 'Lazio',
    time: '21:45',
    date: '19/04/2026',
    isVIP: true,
    vipRank: 3,
    probabilities: { home: 52, draw: 28, away: 20 },
    lineups: {
      home: ['Perin', 'Gatti', 'Bremer', 'Danilo', 'Cambiaso', 'Locatelli', 'Thuram', 'McKennie', 'Yildiz', 'Vlahovic', 'Weah'],
      away: ['Mandas', 'Lazzari', 'Patric', 'Romagnoli', 'Marusic', 'Guendouzi', 'Rovella', 'Castrovilli', 'Isaksen', 'Castellanos', 'Zaccagni']
    }
  },
  {
    id: 'pl-2',
    league: 'Premier League',
    homeTeam: 'Wolves',
    awayTeam: 'Arsenal',
    time: '21:30',
    date: '20/04/2026',
    isVIP: true,
    vipRank: 1,
    aiExplanation: "Arsenal wanarudi kwenye ligi baada ya mechi ya Champions League. Wolves ni timu ngumu nyumbani lakini Arsenal wanahitaji ushindi huu kuendelea kuwania ubingwa.",
    probabilities: { home: 18, draw: 22, away: 60 },
    lineups: {
      home: ['Sa', 'Semeda', 'Kilman', 'Toti', 'Doherty', 'Gomes', 'Lemina', 'Traore', 'Cunha', 'Hwang', 'Sarabia'],
      away: ['Raya', 'White', 'Saliba', 'Gabriel', 'Kiwior', 'Rice', 'Partey', 'Odegaard', 'Saka', 'Martinelli', 'Havertz']
    }
  },
  {
    id: 'nbc-4',
    league: 'NBC Premier League',
    homeTeam: 'Young Africans',
    awayTeam: 'KMC FC',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/2/25/Young_Africans_FC_logo.png',
    awayLogo: 'https://picsum.photos/seed/kmc/100/100',
    time: '19:00',
    date: '19/04/2026',
    isVIP: true,
    vipRank: 1,
    probabilities: { home: 70, draw: 20, away: 10 }
  }
];

export default function App() {
  const [theme, setTheme] = useState<'technical' | 'luxury' | 'bold' | null>(null);
  const [savedPredictions, setSavedPredictions] = useState<SavedMatch[]>([]);
  const [history, setHistory] = useState<{id: string, predictions: SavedMatch[], timestamp: number}[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'live' | 'history' | 'ai' | 'vip' | 'leagues' | 'settings'>('home');
  const [showSlip, setShowSlip] = useState(false);
  const [selectedDate, setSelectedDate] = useState('17/04/2026');
  
  // AI States
  const [analyzingMatch, setAnalyzingMatch] = useState<Match | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [predictionQuery, setPredictionQuery] = useState("");
  const [predictionResult, setPredictionResult] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [leagueSearch, setLeagueSearch] = useState("");
  const [dailyInsight, setDailyInsight] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  // --- Effects ---

  useEffect(() => {
    const fetchDailyInsight = async () => {
      setIsInsightLoading(true);
      try {
        const matchesOnDate = MOCK_MATCHES.filter(m => m.date === selectedDate);
        const matchNames = matchesOnDate.map(m => `${m.homeTeam} vs ${m.awayTeam} (${m.league})`).join(", ");
        
        const prompt = `Wewe ni "AI Engine" ya mfumo huu. Leo ni tarehe ${selectedDate}. Mechi zinazochezwa ni: ${matchNames}. 
        Toa muhtasari (Brief Summary) mfupi na wenye mvuto wa nini wapenzi wa soka wanapaswa kutarajia leo. 
        Zingatia dabi au mechi kubwa. Andika kwa Kiswahili chenye mamlaka na utaalamu wa hali ya juu. 
        Tumia sentensi 3-4 pekee.`;

        const result = await getGlobalPrediction(prompt);
        setDailyInsight(result);
      } catch (e) {
        console.error("Failed to fetch insight", e);
      } finally {
        setIsInsightLoading(false);
      }
    };

    fetchDailyInsight();
  }, [selectedDate]);

  const dates = useMemo(() => {
    const uniqueDates = Array.from(new Set(MOCK_MATCHES.map(m => m.date)));
    return uniqueDates.sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      return new Date(y1, m1-1, d1).getTime() - new Date(y2, m2-1, d2).getTime();
    });
  }, []);

  // --- Handlers ---

  const handleAIAnalysis = async (match: Match) => {
    setAnalyzingMatch(match);
    setIsAnalyzing(true);
    setAnalysisText("");
    const result = await getMatchAnalysis(match.homeTeam, match.awayTeam, match.league);
    setAnalysisText(result);
    setIsAnalyzing(false);
  };

  const handleGlobalPrediction = async () => {
    if (!predictionQuery.trim()) return;
    setIsPredicting(true);
    setPredictionResult("");
    const result = await getGlobalPrediction(predictionQuery);
    setPredictionResult(result);
    setIsPredicting(false);
  };

  const toggleSavedMatch = (match: Match) => {
    const existingIndex = savedPredictions.findIndex(s => s.matchId === match.id);
    
    if (existingIndex > -1) {
      setSavedPredictions(savedPredictions.filter(s => s.matchId !== match.id));
    } else {
      setSavedPredictions([...savedPredictions, {
        matchId: match.id,
        matchName: `${match.homeTeam} vs ${match.awayTeam}`,
        league: match.league,
        time: match.time
      }]);
    }
  };

  const savePredictionHistory = () => {
    if (savedPredictions.length === 0) return;

    const newHistory = {
      id: Math.random().toString(36).substr(2, 9),
      predictions: [...savedPredictions],
      timestamp: Date.now()
    };

    setHistory([newHistory, ...history]);
    setSavedPredictions([]);
    setShowSlip(false);
  };

  const matchesByLeague = useMemo(() => {
    const leagues: Record<string, Match[]> = {};
    MOCK_MATCHES.forEach(m => {
      if (!leagues[m.league]) leagues[m.league] = [];
      leagues[m.league].push(m);
    });
    return leagues;
  }, []);

  return (
    <div className={`min-h-screen text-slate-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden ${
      !theme ? 'bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,_#10b98115_0%,_transparent_50%)]' : 
      theme === 'technical' ? 'bg-slate-950 font-mono' : 
      theme === 'luxury' ? 'bg-black font-sans tracking-wide' : 
      'bg-slate-900 font-black italic uppercase'
    }`}>
      {!theme ? (
        <div className="max-w-4xl w-full text-center">
          <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="mb-12"
          >
             <BrainCircuit className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
             <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">Chagua Muundo wa Mfumo</h1>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Visual Theme Engine Selection</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                id: 'technical', 
                name: 'Technical Engine', 
                desc: 'Dashboard ya kisayansi na takwimu nyingi.', 
                color: 'from-emerald-500/20 to-slate-900',
                border: 'border-emerald-500/30'
              },
              { 
                id: 'luxury', 
                name: 'Dark Luxury', 
                desc: 'Inanukia VIP na Pesa. Minimalist & Gold.', 
                color: 'from-amber-500/20 to-slate-900',
                border: 'border-amber-500/30'
              },
              { 
                id: 'bold', 
                name: 'Modern Bold', 
                desc: 'Herufi kubwa na rangi zenye nguvu za soka.', 
                color: 'from-blue-500/20 to-slate-900',
                border: 'border-blue-500/30'
              }
            ].map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(t.id as any)}
                className={`flex flex-col text-left p-8 bg-gradient-to-br ${t.color} border-2 ${t.border} rounded-[40px] shadow-2xl transition-all relative group overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                <div className="flex-1 space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {t.id === 'technical' ? <Settings className="w-6 h-6 text-emerald-500" /> : 
                     t.id === 'luxury' ? <Shield className="w-6 h-6 text-amber-500" /> : 
                     <Zap className="w-6 h-6 text-blue-500" />}
                  </div>
                  <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">{t.name}</h3>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">{t.desc}</p>
                </div>
                <div className="mt-8 flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Bofya Kutumia</span>
                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ) : (
        <>
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20">
              <BrainCircuit className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-xl font-black italic tracking-tighter bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent leading-none">
                 AI-SOKA GLOBAL
               </h1>
               <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Engine v4.2.0 Active</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Live Processing</span>
                <span className="text-[10px] text-emerald-500 font-black italic">142 Matches Scanned</span>
             </div>
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
               <Globe className="w-3 h-3 text-emerald-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-300 italic">Global Access</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        
        {/* --- Navigation Tabs --- */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { id: 'home', label: 'Mechi za Leo', icon: Home },
            { id: 'vip', label: 'VIP 123', icon: Trophy },
            { id: 'leagues', label: 'Ligi Zote', icon: Search },
            { id: 'live', label: 'Mechi za Live', icon: Zap },
            { id: 'ai', label: 'AI Predictor', icon: BrainCircuit },
            { id: 'history', label: 'Vilizotabiriwa', icon: HistoryIcon },
            { id: 'settings', label: 'Mipangilio', icon: Settings }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all whitespace-nowrap border shrink-0 ${
                activeTab === tab.id 
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-lg shadow-emerald-500/10' 
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'home' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[40px] p-8 relative overflow-hidden group shadow-xl"
          >
            {/* AI Engine Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full animate-pulse" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
               <div className="p-4 bg-emerald-500 rounded-[28px] shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce-slow">
                  <BrainCircuit className="w-8 h-8 text-slate-950" />
               </div>
               <div className="flex-1 text-left">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] bg-slate-950 text-emerald-500 border border-emerald-500/30 px-3 py-1 rounded-full font-black uppercase tracking-[0.3em]">AI Engine Insight</span>
                     {isInsightLoading && (
                       <div className="flex gap-1">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-75" />
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping delay-150" />
                       </div>
                     )}
                  </div>
                  {isInsightLoading ? (
                    <div className="space-y-2">
                       <div className="h-4 bg-slate-800/50 rounded-full w-3/4 animate-pulse" />
                       <div className="h-4 bg-slate-800/50 rounded-full w-1/2 animate-pulse" />
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-slate-200 leading-relaxed italic pr-4">
                       "{dailyInsight || "AI Engine inatayarisha uchambuzi wa leo... tafadhali subiri kidogo."}"
                    </p>
                  )}
               </div>
               <div className="hidden lg:block border-l border-slate-800 pl-8">
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] text-slate-500 font-black uppercase">Engine Status:</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black">ACTIVE</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-600" />
                        <span className="text-[10px] text-slate-500 font-black uppercase">Accuracy:</span>
                        <span className="text-[10px] text-slate-500 font-black">98.4%</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'home' && (
          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-3">
              {dates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-6 py-3 rounded-2xl border transition-all whitespace-nowrap flex flex-col items-center min-w-[100px] ${
                    selectedDate === date
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-black opacity-60 mb-1">Tarehe</span>
                  <span className="text-sm">{date}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'home' || activeTab === 'live' || activeTab === 'vip' ? (
          <div className="space-y-6 text-left">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl flex items-center gap-2">
                {activeTab === 'home' ? <Calendar className="w-5 h-5 text-emerald-500" /> : activeTab === 'vip' ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Zap className="w-5 h-5 text-red-500 animate-pulse" />}
                {activeTab === 'home' ? `Mechi za ${selectedDate}` : activeTab === 'vip' ? 'VIP 123 - Premium Picks' : 'Mechi zinazoendelea (Live)'}
              </h3>
            </div>

            {/* --- Match List --- */}
            <div className="space-y-4">
              {MOCK_MATCHES
                .filter(m => {
                  if (activeTab === 'home') return m.date === selectedDate;
                  if (activeTab === 'live') return m.isLive;
                  if (activeTab === 'vip') return m.isVIP;
                  return true;
                })
                .sort((a, b) => (activeTab === 'vip' ? (a.vipRank || 9) - (b.vipRank || 9) : 0))
                .map((match) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={match.id} 
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col hover:border-slate-700 transition-colors gap-6 relative overflow-hidden"
                >
                  {activeTab === 'vip' && match.vipRank && (
                    <div className="absolute top-0 left-0 bg-yellow-500 text-slate-950 px-4 py-1 rounded-br-2xl font-black text-xs z-10 shadow-lg">
                      RANK #{match.vipRank}
                    </div>
                  )}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[10px] text-slate-400 font-black px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 uppercase tracking-widest">{match.league}</span>
                        <span className="text-[10px] text-emerald-500/80 font-black px-2 py-0.5 bg-emerald-500/5 rounded-full border border-emerald-500/20 uppercase tracking-widest">{match.date}</span>
                        {match.isLive && (
                          <span className="flex items-center gap-1.5 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-black animate-pulse border border-red-500/20">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            LIVE
                          </span>
                        )}
                        {match.isVIP && (
                          <span className="flex items-center gap-1 text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-black border border-yellow-500/20">
                            <Trophy className="w-3 h-3" />
                            VIP
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between lg:justify-start gap-8">
                        <div className="flex items-center gap-6 flex-1">
                          {/* Home Team */}
                          <div className="flex items-center gap-3 flex-1 justify-end text-right">
                             <span className="font-black text-lg sm:text-xl leading-tight tracking-tighter truncate max-w-[120px] sm:max-w-none">{match.homeTeam}</span>
                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-500/30 transition-colors bg-white">
                                <img 
                                  src={match.homeLogo || `https://picsum.photos/seed/${match.homeTeam}/100/100`} 
                                  alt={match.homeTeam} 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                             </div>
                          </div>

                          <div className="flex flex-col items-center shrink-0">
                             {match.isLive && match.score ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-4 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
                                   <span className="text-2xl font-black tabular-nums text-emerald-500">{match.score.home}</span>
                                   <span className="text-slate-700 font-bold">-</span>
                                   <span className="text-2xl font-black tabular-nums text-emerald-500">{match.score.away}</span>
                                </div>
                             ) : (
                                <div className="w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center">
                                   <span className="text-[10px] font-black text-slate-700 italic">VS</span>
                                </div>
                             )}
                          </div>

                          {/* Away Team */}
                          <div className="flex items-center gap-3 flex-1 text-left">
                             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-950 rounded-2xl border border-slate-800 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:border-emerald-500/30 transition-colors bg-white">
                                <img 
                                  src={match.awayLogo || `https://picsum.photos/seed/${match.awayTeam}/100/100`} 
                                  alt={match.awayTeam} 
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                             </div>
                             <span className="font-black text-lg sm:text-xl leading-tight tracking-tighter truncate max-w-[120px] sm:max-w-none">{match.awayTeam}</span>
                          </div>
                        </div>

                        {match.probabilities && (
                          <div className="hidden md:flex flex-col gap-1 w-32 border-x border-slate-800 px-4">
                            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 italic">
                               <span>{match.probabilities.home}%</span>
                               <span>{match.probabilities.draw}%</span>
                               <span>{match.probabilities.away}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                               <div className="h-full bg-emerald-500" style={{ width: `${match.probabilities.home}%` }} />
                               <div className="h-full bg-slate-600" style={{ width: `${match.probabilities.draw}%` }} />
                               <div className="h-full bg-slate-400" style={{ width: `${match.probabilities.away}%` }} />
                            </div>
                            <p className="text-[8px] text-slate-600 font-black uppercase text-center mt-1">Ushindi %</p>
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block text-right">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Muda</p>
                            <p className="font-black text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{match.time}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleAIAnalysis(match)}
                              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-500 px-4 py-2.5 rounded-2xl transition-all group border border-slate-700 active:scale-95"
                            >
                              <BrainCircuit className="w-5 h-5" />
                              <span className="font-black text-xs uppercase italic hidden sm:inline">Uchambuzi AI</span>
                            </button>

                            <button 
                              onClick={() => toggleSavedMatch(match)}
                              className={`p-2.5 rounded-2xl transition-all flex items-center gap-2 border ${
                                savedPredictions.find(s => s.matchId === match.id)
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-emerald-500'
                              }`}
                            >
                              {savedPredictions.find(s => s.matchId === match.id) ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                              <span className="font-black text-xs uppercase hidden sm:inline">{savedPredictions.find(s => s.matchId === match.id) ? 'Imehifadhiwa' : 'Hifadhi'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- AI Preview Reason --- */}
                  {match.aiExplanation && (
                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 flex gap-3 items-start">
                      <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-slate-400 text-xs font-bold leading-relaxed">
                        <span className="text-emerald-500 uppercase font-black mr-2">Kwa nini uchague:</span>
                        {match.aiExplanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : activeTab === 'leagues' ? (
          /* --- Global Leagues Directory --- */
          <div className="space-y-10 text-left">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Globe className="w-24 h-24" />
               </div>
               <div className="relative z-10 max-w-xl">
                  <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">Mataifa & Ligi Zote</h2>
                  <p className="text-slate-400 font-bold text-sm mb-8">Pata utabiri wa uhakika wa zaidi ya ligi 1,500 duniani kote.</p>
                  
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Tafuta nchi au jina la ligi..."
                      className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-5 pl-16 pr-6 font-black focus:border-emerald-500 outline-none transition-all placeholder:opacity-40"
                      value={leagueSearch}
                      onChange={(e) => setLeagueSearch(e.target.value)}
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
               {(Object.entries(matchesByLeague) as [string, Match[]][])
                .filter(([name]) => name.toLowerCase().includes(leagueSearch.toLowerCase()))
                .map(([leagueName, matches]) => (
                  <div key={leagueName} className="space-y-4">
                     <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl">
                              <Trophy className="w-5 h-5 text-emerald-500" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{leagueName}</h3>
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{matches.length} Mechi Zilizopo</p>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map((match: Match) => (
                           <motion.div 
                             key={match.id}
                             whileHover={{ y: -5 }}
                             onClick={() => handleAIAnalysis(match)}
                             className="bg-slate-900 border border-slate-800 rounded-[35px] p-6 hover:border-emerald-500/30 transition-all cursor-pointer relative group flex flex-col"
                           >
                              <div className="flex items-center justify-between mb-6">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">{match.time} • {match.date}</span>
                                 <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                 </div>
                              </div>

                              <div className="flex flex-col gap-4 mb-8 flex-1 justify-center">
                                 <div className="flex items-center justify-between">
                                    <span className="text-xl font-black tracking-tight">{match.homeTeam}</span>
                                    <span className="text-xs font-black text-slate-600 italic">Home</span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <span className="text-xl font-black tracking-tight">{match.awayTeam}</span>
                                    <span className="text-xs font-black text-slate-600 italic">Away</span>
                                 </div>
                              </div>

                              <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                                 <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                       <BrainCircuit className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">AI Uchambuzi</span>
                                 </div>
                                 <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-emerald-500 transition-colors" />
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  </div>
               ))}
               
               {Object.keys(matchesByLeague).filter(l => l.toLowerCase().includes(leagueSearch.toLowerCase())).length === 0 && (
                  <div className="py-24 bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-[50px] text-center">
                     <div className="bg-slate-950 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
                        <Search className="w-10 h-10 text-slate-700" />
                     </div>
                     <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tight">Haikupatikana</h3>
                     <p className="text-slate-500 max-w-sm mx-auto font-bold text-sm">Samahani, hatujapata ligi inayolingana na "<strong>{leagueSearch}</strong>". Unaweza kutumia AI Predictor kutabiri timu yenyewe.</p>
                  </div>
               )}
            </div>
          </div>
        ) : activeTab === 'ai' ? (
          /* --- Global AI Predictor Tab --- */
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-2">
                <BrainCircuit className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight">AI Global Predictor</h2>
              <p className="text-slate-400">Uliza kuhusu timu au mechi yoyote duniani, AI itafanya uchambuzi wa kina na kutoa utabiri usio na makosa.</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/20" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Muda huu: Yanga vs Simba, au Man City vs Arsenal..."
                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl py-6 pl-14 pr-6 font-bold focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 focus:shadow-[0_0_30px_rgba(16,185,129,0.1)]"
                    value={predictionQuery}
                    onChange={(e) => setPredictionQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalPrediction()}
                  />
                </div>
                
                <button 
                  onClick={handleGlobalPrediction}
                  disabled={isPredicting || !predictionQuery.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-5 rounded-3xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>AI INACHAMBUA...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-6 h-6 fill-slate-950" />
                      <span>PATA UTABIRI WA LIVE</span>
                    </>
                  )}
                </button>
              </div>

              {predictionResult && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-10 p-6 bg-slate-950 rounded-3xl border border-slate-800 prose prose-invert max-w-none prose-emerald"
                >
                  <div className="flex items-center gap-2 mb-4 text-emerald-500 font-black uppercase text-xs tracking-widest">
                    <CheckCircle2 className="w-4 h-4" />
                    Utabiri wa AI
                  </div>
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {predictionResult}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          /* --- History Tab --- */
          <div className="space-y-4 text-left max-w-2xl mx-auto">
             <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
              <HistoryIcon className="w-6 h-6 text-emerald-500" />
              Historia ya Utabiri
            </h2>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 italic bg-slate-900 border border-slate-800 rounded-[40px]">
                <HistoryIcon className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold">Huna historia ya utabiri bado.</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 relative overflow-hidden group hover:border-slate-700 transition-all text-left shadow-xl">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">UTABIRI ID: #{item.id}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-emerald-500" />
                        <p className="text-xs text-slate-400 font-bold">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                       <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Ilikamilika</span>
                    </div>
                  </div>
                  
                   <div className="space-y-3 bg-slate-950 p-5 rounded-3xl border border-slate-800">
                    {item.predictions.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-2 last:border-0 border-b border-slate-800/50">
                        <div className="flex flex-col">
                          <span className="text-slate-200 font-black italic">{s.matchName}</span>
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{s.league}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 font-black">{s.time}</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* --- Settings Tab with Engine Diagnostics --- */
          <div className="space-y-10 text-left max-w-2xl mx-auto">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full" />
               
               <div className="flex items-center gap-6 mb-10">
                  <div className="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <User className="w-10 h-10 text-slate-950" />
                  </div>
                  <div>
                     <h2 className="text-3xl font-black uppercase italic tracking-tighter">Akaunti & Mfumo</h2>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em]">VIP PREMIUM ACTIVE</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-6">
                  {/* Engine Diagnostics */}
                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden group">
                     <div className="scan-line absolute inset-0 opacity-10 pointer-events-none" />
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <BrainCircuit className="w-5 h-5 text-emerald-500" />
                           <span className="font-black uppercase tracking-tight text-sm">AI Engine Diagnostics</span>
                        </div>
                        <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">OPTIMIZED</span>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                           <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Logic Core</p>
                           <p className="text-sm font-black text-emerald-500">v4.2.0-Alpha</p>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                           <p className="text-[8px] text-slate-500 font-black uppercase mb-1">System Load</p>
                           <p className="text-sm font-black text-slate-200">0.032ms / req</p>
                        </div>
                     </div>
                  </div>

                  {/* Standard Settings */}
                  <div className="grid grid-cols-1 gap-3">
                     {[
                        { label: 'Lugha ya Mfumo', value: 'Kiswahili', icon: Globe },
                        { label: 'Arifa za Mechi', value: 'ZIMEWASHWA', icon: Bell },
                        { label: 'Faragha & Usalama', value: 'IMEHIFADHIWA', icon: Shield },
                        { label: 'Maoni ya Mfumo', value: 'Tuma Feedback', icon: Zap }
                     ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all cursor-pointer group">
                           <div className="flex items-center gap-4">
                              <item.icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                              <span className="text-sm font-black text-slate-400 group-hover:text-slate-100">{item.label}</span>
                           </div>
                           <span className="text-[10px] font-black text-emerald-500 italic uppercase tracking-widest">{item.value}</span>
                        </div>
                     ))}
                  </div>

                  <button className="w-full py-5 text-slate-600 hover:text-red-500 font-black text-[10px] uppercase tracking-[0.4em] transition-colors pt-4 border-t border-slate-800/50">
                     Log out kutoka akaunti
                  </button>
               </div>
            </motion.div>

            <div className="py-8 text-center opacity-30">
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.5em] mb-2">Developed by AI Soccer Engine</p>
               <div className="flex justify-center gap-4">
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
               </div>
            </div>
          </div>
        )}
      </main>

      {/* --- AI Analysis Modal --- */}
      <AnimatePresence>
        {analyzingMatch && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAnalyzingMatch(null)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-x-auto sm:top-20 sm:bottom-20 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-2xl bg-slate-900 border border-slate-800 rounded-[40px] z-[110] shadow-2xl flex flex-col p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <BrainCircuit className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight">Uchambuzi wa <span className="text-emerald-500">AI</span></h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 text-left">Deep Match Analysis</p>
                  </div>
                </div>
                <button onClick={() => setAnalyzingMatch(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-slate-950/50 rounded-3xl border border-slate-800/50 mb-8">
                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mb-3">{analyzingMatch.league}</span>
                <div className="flex items-center gap-6">
                  <span className="text-xl font-black uppercase">{analyzingMatch.homeTeam}</span>
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-800 rounded-2xl font-black text-slate-500 italic text-center">VS</div>
                  <span className="text-xl font-black uppercase">{analyzingMatch.awayTeam}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full"
                      />
                      <BrainCircuit className="w-8 h-8 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center animate-pulse">
                      <p className="font-black text-xl mb-1 italic tracking-tight uppercase">AI Inatengeneza Uchambuzi...</p>
                      <p className="text-slate-500 text-sm">Tunahakiki takwimu, Vikosi na Fomu...</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8 pb-10"
                  >
                    {/* --- Visual Probabilities --- */}
                    {analyzingMatch.probabilities && (
                      <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                         <h3 className="text-xs font-black uppercase text-slate-500 mb-4 tracking-widest text-left">Uwezekano wa Ushindi (%)</h3>
                         <div className="flex items-center gap-4">
                            <div className="flex-1 flex flex-col items-center">
                               <span className="text-2xl font-black text-emerald-500">{analyzingMatch.probabilities.home}%</span>
                               <span className="text-[10px] text-slate-500 uppercase font-black">Home</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center border-x border-slate-800">
                               <span className="text-2xl font-black text-slate-300">{analyzingMatch.probabilities.draw}%</span>
                               <span className="text-[10px] text-slate-500 uppercase font-black">Draw</span>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                               <span className="text-2xl font-black text-slate-400">{analyzingMatch.probabilities.away}%</span>
                               <span className="text-[10px] text-slate-500 uppercase font-black">Away</span>
                            </div>
                         </div>
                      </div>
                    )}

                    {/* --- Lineups --- */}
                    {analyzingMatch.lineups && (
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                            <h3 className="text-[10px] font-black uppercase text-emerald-500 mb-4 tracking-widest text-left">Kikosi (Home)</h3>
                            <ul className="text-left space-y-1">
                               {analyzingMatch.lineups.home.map((player, i) => (
                                 <li key={i} className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                    <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                    {player}
                                 </li>
                               ))}
                            </ul>
                         </div>
                         <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800">
                            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest text-left">Kikosi (Away)</h3>
                            <ul className="text-left space-y-1">
                               {analyzingMatch.lineups.away.map((player, i) => (
                                 <li key={i} className="text-xs text-slate-400 font-bold flex items-center gap-2">
                                    <div className="w-1 h-1 bg-slate-600 rounded-full" />
                                    {player}
                                 </li>
                               ))}
                            </ul>
                         </div>
                      </div>
                    )}

                    <div className="prose prose-invert max-w-none text-left leading-relaxed">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                         <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-[32px]">
                            <p className="text-[10px] font-black uppercase text-emerald-500 mb-4 tracking-[0.2em]">Utabiri wa Ushindi</p>
                            <div className="flex items-center justify-between">
                               <div className="text-center">
                                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">NYUMBA</p>
                                  <p className="text-2xl font-black text-white">{analyzingMatch?.probabilities?.home}%</p>
                               </div>
                               <div className="text-center border-x border-slate-800 px-6">
                                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">SARE</p>
                                  <p className="text-2xl font-black text-white">{analyzingMatch?.probabilities?.draw}%</p>
                               </div>
                               <div className="text-center">
                                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">UGENI</p>
                                  <p className="text-2xl font-black text-white">{analyzingMatch?.probabilities?.away}%</p>
                               </div>
                            </div>
                         </div>
                         <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-[32px] flex items-center justify-between">
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Kivutio Kikuu</p>
                               <p className="text-lg font-black italic text-emerald-500">Masoko 12+ AI</p>
                               <p className="text-[9px] text-slate-500 italic mt-1 font-bold">Uchambuzi wa Magoli, Kona na Kadi..</p>
                            </div>
                            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                               <Zap className="w-6 h-6 text-yellow-500 animate-pulse" />
                            </div>
                         </div>
                      </div>

                      <div className="bg-slate-950 p-8 rounded-[40px] border border-slate-800 shadow-inner whitespace-pre-wrap font-medium text-slate-200 border-2 border-emerald-500/5">
                        {analysisText}
                      </div>

                      <div className="mt-8 p-8 bg-slate-900 border border-slate-800 rounded-[40px] relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                         <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500 mb-6 flex items-center gap-2 relative">
                            <Globe className="w-4 h-4" /> USHINDI WA MASOKO MENGINE
                         </h4>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
                            {[
                               { l: 'Magoli', s: 'AI Over 2.5', c: 'text-emerald-500' },
                               { l: 'BTTS', s: 'Ndiyo (75%)', c: 'text-emerald-500' },
                               { l: 'Idadi Kona', s: 'Nyingi', c: 'text-slate-200' },
                               { l: 'Kadi', s: 'Chache', c: 'text-slate-200' }
                            ].map((m, i) => (
                               <div key={i} className="bg-slate-950/80 p-4 rounded-3xl border border-slate-800 text-center hover:border-emerald-500/20 transition-all">
                                  <p className="text-[9px] uppercase font-black text-slate-500 mb-2">{m.l}</p>
                                  <p className={`text-xs font-black ${m.c}`}>{m.s}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {!isAnalyzing && (
                <div className="pt-6 border-t border-slate-800">
                  <button 
                    onClick={() => setAnalyzingMatch(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-[0.2em] text-xs"
                  >
                    Funga Uchambuzi
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Sticky Footer Action --- */}
      <AnimatePresence>
        {savedPredictions.length > 0 && activeTab !== 'ai' && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"
          >
            <button 
              onClick={() => setShowSlip(true)}
              className="w-full max-w-lg mx-auto bg-slate-900 border-2 border-emerald-500/30 text-emerald-500 p-4 rounded-3xl flex items-center justify-between shadow-2xl shadow-emerald-500/10 font-black pointer-events-auto active:scale-[0.98] transition-all ring-4 ring-slate-950/50"
            >
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center font-black">
                  {savedPredictions.length}
                </div>
                <span className="uppercase tracking-tight text-lg italic">Mechi Zangu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-black">Angalia</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Saved Matches Drawer --- */}
      <AnimatePresence>
        {showSlip && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSlip(false)}
              className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[120]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 rounded-t-[50px] z-[130] max-h-[95vh] overflow-hidden flex flex-col shadow-[0_-20px_60px_-15px_rgba(16,185,129,0.3)]"
            >
              <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-4 mb-2" />
              <div className="p-8 flex items-center justify-between border-b border-slate-800">
                <h2 className="text-2xl font-black italic uppercase">
                  MECHI <span className="text-emerald-500 tracking-wider">ZILIZOHIFADHIWA</span>
                </h2>
                <button onClick={() => setShowSlip(false)} className="bg-slate-800 p-3 rounded-2xl text-slate-400 hover:text-white transition-colors border border-slate-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {savedPredictions.map((sel) => {
                  const match = MOCK_MATCHES.find(m => m.id === sel.matchId);
                  return (
                    <div key={sel.matchId} className="bg-slate-800/40 rounded-3xl p-5 relative border border-slate-800 group hover:border-slate-700 transition-all text-left">
                      <button 
                         onClick={() => toggleSavedMatch(match!)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="mb-2 text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] flex items-center gap-2">
                         <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                         {sel.league}
                      </div>
                      <p className="font-black text-xl mb-4 pr-10">{sel.matchName}</p>
                      <div className="flex justify-between items-center text-sm p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-500 font-bold text-xs uppercase">{sel.time} - Ipo kwenye Watchlist yako</span>
                        </div>
                        <button 
                           onClick={() => { setShowSlip(false); handleAIAnalysis(match!); }}
                           className="text-[10px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20 font-black uppercase tracking-tight hover:bg-emerald-500 hover:text-slate-950 transition-all"
                        >
                           Tazama Utabiri
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {savedPredictions.length === 0 && (
                  <div className="text-center py-20 text-slate-500">
                    <Smartphone className="w-16 h-16 mx-auto mb-6 opacity-5" />
                    <p className="text-xl font-bold italic">Hujachagua mechi yoyote bado.</p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-950/80 backdrop-blur-md space-y-6 border-t border-slate-800">
                <p className="text-slate-400 text-sm italic text-center">
                  Hifadhi mechi unazotaka kuzifuatilia ili kupata uchambuzi pindi zinapoanza.
                </p>

                <button 
                  onClick={savePredictionHistory}
                  disabled={savedPredictions.length === 0}
                  className="w-full bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 py-6 rounded-[30px] font-black text-xl shadow-[0_10px_40px_-5px_rgba(16,185,129,0.5)] active:scale-95 transition-all uppercase tracking-[0.1em]"
                >
                  HAMISHIA KWENYE HISTORIA
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- Win Animation Overlay Removed --- */}
        </>
      )}
    </div>
  );
}
