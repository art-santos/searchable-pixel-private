import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector";
import { MetricItem } from "@/components/custom/metric-item";
import { ProgressBar } from "@/components/ui/progress-bar";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion, Variants } from "framer-motion";

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
  const [timeframe, setTimeframe] = useState<TimeframeOption>("This Month");
  const total = barData.reduce((sum, b) => sum + b.value, 0);
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const cardVariants: Variants = shouldReduceMotion 
    ? { hidden: {}, visible: {} } 
    : {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      };
      
  const barVariants: Variants = shouldReduceMotion 
    ? { hidden: {}, visible: {} } 
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3, ease: 'easeOut' } },
      };
      
  const rowVariants: Variants = shouldReduceMotion 
    ? { hidden: {}, visible: {} } 
    : {
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
          <TimeframeSelector 
            title="Topic Visibility" 
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe}
            titleColor="text-white"
            selectorColor="text-[#A7A7A7]"
          />
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
          className="mb-8"
        >
          <ProgressBar segments={barData} />
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
            >
              <MetricItem
                className="mb-1"
                rank={topic.rank}
                label={topic.label}
                change={{ value: topic.change, positive: topic.positive }}
                link={topic.link}
              />
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