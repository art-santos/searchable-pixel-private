import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeframeSelector } from "@/components/custom/timeframe-selector";
import { MetricItem } from "@/components/custom/metric-item";
import { TimeframeType } from "./page-view-card";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, useReducedMotion } from "framer-motion";

const topics = [
  "AI research agents",
  "Lead generation tools",
  "AI sales representatives",
  "YC's hottest startups",
  "AI Agents",
];

const competitors = [
  {
    logo: "/salesforce.svg",
    url: "salesforce.com",
    score: 89.9,
  },
  {
    logo: "/gong.svg",
    url: "gong.io",
    score: 84.8,
  },
  {
    logo: "/clari.svg",
    url: "clari.com",
    score: 82.1,
  },
  {
    logo: "/apollo.svg",
    url: "apollo.io",
    score: 79.4,
  },
  // The user's company is always shown as #5, regardless of actual rank. See note below.
  {
    logo: "/origami-favicon.svg",
    url: "origamiagents.com",
    score: 72.2,
    isUser: true, // <-- This is the user's company, always shown as #5
  },
];

export function CompetitorBenchmarkingCard() {
  const [timeframe, setTimeframe] = useState<TimeframeType>("This Month");
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const shouldReduceMotion = useReducedMotion();

  // Animation variants
  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      };
  const rowVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
          opacity: 1, y: 0,
          transition: { delay: 0.25 + i * 0.07, duration: 0.25, ease: 'easeOut' },
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
            title="Competitor Benchmarking" 
            timeframe={timeframe} 
            onTimeframeChange={setTimeframe}
            titleColor="text-white"
            selectorColor="text-[#A7A7A7]"
          />
        </div>
        <div className="mt-3 mb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-fit min-w-[140px] border border-[#333333] bg-transparent hover:bg-[#1a1a1a] px-4 rounded-none flex items-center gap-2"
              >
                <span className="font-geist-semi text-white">{selectedTopic}</span>
                <ChevronDown className="h-4 w-4 text-[#666666]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none">
              {topics.map((topic) => (
                <DropdownMenuItem
                  key={topic}
                  className="hover:bg-[#222222] rounded-none"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <span className="text-base font-geist-semi">{topic}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2">
        <div className="flex flex-col gap-1">
          {competitors.map((comp, idx) => (
            <motion.div
              key={comp.url}
              custom={idx}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center justify-between py-2 px-4 border-b border-[#222222] last:border-b-0">
                <div className="flex items-center gap-4">
                  <span className="text-[#666] font-mono">{idx + 1}</span>
                  <div className="w-8 h-8 bg-[#181818] border border-[#222] overflow-hidden">
                    <Image src={`/images/${idx + 1}.png`} alt={`Rank ${idx + 1}`} width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white font-medium text-sm">{comp.url}</span>
                </div>
                <span className="text-white font-mono text-sm">{comp.score.toFixed(1)}%</span>
              </div>
            </motion.div>
          ))}
        </div>
        {/*
          Note: The user's company is always shown as #5, regardless of actual rank in the data.
          If the user's company is not in the top 5, it is still displayed as the 5th item.
        */}
      </CardContent>
    </motion.div>
  );
} 