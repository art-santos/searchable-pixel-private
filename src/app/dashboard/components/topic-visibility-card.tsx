import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeframeSelector } from "./page-view-card/timeframe-selector";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const topics = [
  {
    rank: 1,
    label: "AI research agents",
    sources: [
      { src: "/ycombinator.svg", alt: "YCombinator" },
      { src: "/techcrunch.svg", alt: "TechCrunch" },
    ],
    change: 12,
    positive: true,
    link: "#",
  },
  {
    rank: 2,
    label: "Lead generation tools",
    sources: [
      { src: "/techcrunch.svg", alt: "TechCrunch" },
    ],
    change: 17,
    positive: true,
    link: "#",
  },
  {
    rank: 3,
    label: "AI sales representatives",
    sources: [
      { src: "/ycombinator.svg", alt: "YCombinator" },
    ],
    change: 4,
    positive: false,
    link: "#",
  },
  {
    rank: 4,
    label: "YC's hottest startups",
    sources: [
      { src: "/vbs.svg", alt: "VBS" },
    ],
    change: 2,
    positive: true,
    link: "#",
  },
  {
    rank: 5,
    label: "AI Agents",
    sources: [
      { src: "/g2.svg", alt: "G2" },
    ],
    change: 10,
    positive: false,
    link: "#",
  },
];

const barData = [
  { label: "Owned", value: 60, color: "#666666" },
  { label: "Operated", value: 25, color: "#444444" },
  { label: "Earned", value: 15, color: "#222222" },
];

export function TopicVisibilityCard() {
  const [timeframe, setTimeframe] = useState("Last 30 Days");
  const total = barData.reduce((sum, b) => sum + b.value, 0);
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const cardVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  };
  const barVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3, ease: 'easeOut' } },
  };
  const rowVariants = shouldReduceMotion ? {} : {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: 0.25 + i * 0.07, duration: 0.25, ease: 'easeOut' }
    }),
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="h-full bg-transparent border-none shadow-none"
    >
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
          <TimeframeSelector title="Topic Visibility" timeframe={timeframe} onTimeframeChange={setTimeframe} />
        </div>
        {/* Stats/Labels Bar */}
        <motion.div
          variants={barVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-8 mt-8 mb-4"
        >
          {barData.map((b, i) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="inline-block w-3 h-3" style={{ background: b.color }} />
              <span className="text-xs text-[#bbb] font-geist tracking-tight">{b.label}</span>
            </div>
          ))}
        </motion.div>
        {/* Percentage Bar */}
        <motion.div
          variants={barVariants}
          initial="hidden"
          animate="visible"
          className="w-full h-4 bg-[#232323] mt-0 flex mb-8"
        >
          {barData.map((b, i) => (
            <div
              key={b.label}
              style={{ width: `${(b.value / total) * 100}%`, background: b.color, borderRadius: 0 }}
              className="h-full group relative cursor-pointer"
            >
              {/* Tooltip on hover/focus */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-8 z-[9999] hidden group-hover:flex group-focus:flex flex-col items-center">
                <div className="px-2 py-1 rounded bg-[#222] text-xs text-white font-geist shadow">
                  {b.label}: {Math.round((b.value / total) * 100)}%
                </div>
                <div className="w-2 h-2 bg-[#222] rotate-45 -mt-1" />
              </div>
            </div>
          ))}
        </motion.div>
      </CardHeader>
      <CardContent className="pt-2 pb-0">
        <div className="flex flex-col gap-3">
          {topics.map((topic, idx) => (
            <motion.div
              key={topic.rank}
              custom={idx}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between border border-[#222] bg-[#111111] px-6 py-2 w-full mb-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[#666] text-lg font-mono tracking-tight w-8">#{topic.rank}</span>
                <span className="text-white text-base truncate max-w-[220px]">{topic.label}</span>
                <div className="flex items-center gap-1 ml-2">
                  {/* Citation icons removed as requested */}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`text-sm font-mono tracking-tight ${topic.positive ? 'text-green-500' : 'text-red-500'}`}>{topic.positive ? '↑' : '↓'}{topic.change}%</span>
                <a href={topic.link} className="text-sm text-[#aaa] hover:text-white transition-colors font-geist tracking-tight flex items-center gap-1">
                  View Citations <span className="text-lg">→</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="pt-4 pl-2">
          <a href="#" className="text-[#666] text-sm font-mono tracking-tight hover:text-white transition-colors">View more...</a>
        </div>
      </CardContent>
    </motion.div>
  );
} 