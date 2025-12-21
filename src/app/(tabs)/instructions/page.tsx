"use client";

import { useLanguage } from "~/lib/language-context";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  Ticket, 
  Info, 
  AlertCircle 
} from "lucide-react";

export default function InstructionsPage() {
  const { strings } = useLanguage();
  const s = strings.instructions;

  const steps = [
    { icon: Calendar, title: s.step1Title, desc: s.step1Desc },
    { icon: Clock, title: s.step2Title, desc: s.step2Desc },
    { icon: User, title: s.step3Title, desc: s.step3Desc },
    { icon: CreditCard, title: s.step4Title, desc: s.step4Desc },
    { icon: Ticket, title: s.step5Title, desc: s.step5Desc },
  ];

  const rules = [s.rule1, s.rule2, s.rule3, s.rule4];

  return (
    <div className="flex flex-col gap-8 p-6 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{s.title}</h1>
        <p className="text-muted-foreground mt-2">{s.subtitle}</p>
      </header>

      <section className="flex flex-col gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-4"
          >
            <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold">
              <step.icon size={24} />
            </div>
            <div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      <section className="bg-muted/50 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Info className="text-primary" size={20} />
          <h2 className="text-xl font-bold">{s.rulesTitle}</h2>
        </div>
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <li key={index} className="flex gap-3 text-sm">
              <AlertCircle className="text-muted-foreground shrink-0" size={16} />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
