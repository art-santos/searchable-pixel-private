import { DomainSelector } from "@/components/custom/domain-selector"
import { Sparkles } from "lucide-react"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"

const SUMMARY_TEXT = `Your AEO structure is solid overall, with a strong meta title and description and a clean crawl across 28 pages. However, the absence of an llms.txt file and inconsistent or missing JSON-LD schema significantly reduce your likelihood of being quoted by large language models. While content quality is sufficient, lack of structured data makes it harder for LLMs to understand and cite your content accurately.`

function TypewriterMarkdown({ text, speed = 18 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const i = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayed(text);
      return;
    }
    i.current = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i.current + 1));
      i.current++;
      if (i.current >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, shouldReduceMotion]);

  return (
    <ReactMarkdown
      components={{
        p: ({node, ...props}) => <p className="text-sm font-mono tracking-tight text-white" {...props} />
      }}
    >
      {displayed}
    </ReactMarkdown>
  );
}

export function AEOScorecard() {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimation();
  const [circleDash, setCircleDash] = useState("0 552.92");

  useEffect(() => {
    if (shouldReduceMotion) {
      setCircleDash(`${(72.2 * 552.92) / 100} 552.92`);
      return;
    }
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    });
    const start = 0;
    const end = (72.2 * 552.92) / 100;
    const duration = 1000;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = start + (end - start) * progress;
      setCircleDash(`${value} 552.92`);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [controls, shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={controls}
      style={{ willChange: "opacity, transform" }}
      className="flex flex-col gap-6"
    >
      {/* Domain Selector */}
      <DomainSelector />

      {/* Score and Last Updated */}
      <div className="space-y-1">
        <h3 className="text-base font-medium text-[#A7A7A7]">AEO Scorecard</h3>
        <div className="flex items-center gap-2">
          <span className="font-geist-semi text-white">Last updated 30 minutes ago</span>
        </div>
      </div>

      {/* Site Info and Score Circle */}
      <div className="flex justify-between items-start gap-8">
        <div className="flex flex-col gap-6 flex-1 max-w-[65%]">
          {/* Site Title */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col gap-2">
            <p className="text-xs font-mono tracking-tight text-[#666666]">SITE TITLE</p>
            <p className="text-base font-medium text-white max-w-[90%]">Origami Agents: AI-Powered B2B Lead Generation Platform</p>
          </motion.div>

          {/* Meta Description */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col gap-2">
            <p className="text-xs font-mono tracking-tight text-[#666666]">META DESCRIPTION</p>
            <p className="text-sm text-white max-w-[90%]">Origami Agents provides AI research agents to automate prospecting, identify buying signals, and generate high-intent B2B sales leads. Book a demo!</p>
          </motion.div>

          {/* Stats Badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-3">
            <div className="bg-[#0c0c0c] px-3 py-1.5 border border-[#333333]">
              <p className="text-[11px] font-mono tracking-tighter text-white whitespace-nowrap">28 Pages Crawled</p>
            </div>
            <div className="bg-[#0c0c0c] px-3 py-1.5 border border-[#333333]">
              <p className="text-[11px] font-mono tracking-tighter text-white whitespace-nowrap">2 Critical Issues</p>
            </div>
            <div className="bg-[#0c0c0c] px-3 py-1.5 border border-[#333333]">
              <p className="text-[11px] font-mono tracking-tighter text-white whitespace-nowrap">29 Warnings</p>
            </div>
          </motion.div>

          {/* AI Summary */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white" />
              <p className="text-xs font-mono tracking-tight text-[#666666]">AI SUMMARY</p>
            </div>
            <div className="flex flex-col">
              <div className="relative max-w-[90%]">
                <div className="max-h-[88px] overflow-hidden">
                  <TypewriterMarkdown text={SUMMARY_TEXT} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-[#0c0c0c] pointer-events-none" />
              </div>
              <p className="text-sm font-mono tracking-tight text-[#666666] cursor-pointer hover:text-white transition-colors">
                See more...
              </p>
            </div>
          </motion.div>
        </div>

        {/* Score Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          className="relative w-48 h-48"
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 208 208">
            <circle
              cx="104"
              cy="104"
              r="88"
              fill="none"
              stroke="#222222"
              strokeWidth="16"
            />
            <motion.circle
              cx="104"
              cy="104"
              r="88"
              fill="none"
              stroke="white"
              strokeWidth="16"
              strokeDasharray={circleDash}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-4xl font-mono tracking-tight text-white">72.2%</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
} 