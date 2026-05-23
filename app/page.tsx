"use client";

import { useState, useEffect, useCallback } from "react";

type Shortcut = { id: string; description: string; keys: string };

const DEFAULTS: Shortcut[] = [
  { id: "1", description: "コマンドパレット", keys: "Ctrl+Shift+P" },
  { id: "2", description: "ファイルを保存", keys: "Ctrl+S" },
  { id: "3", description: "元に戻す", keys: "Ctrl+Z" },
  { id: "4", description: "やり直す", keys: "Ctrl+Y" },
  { id: "5", description: "コピー", keys: "Ctrl+C" },
  { id: "6", description: "ペースト", keys: "Ctrl+V" },
];

function captureCombo(e: KeyboardEvent): string | null {
  const modifiers = ["Control", "Shift", "Alt", "Meta"];
  if (modifiers.includes(e.key)) return null;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");
  if (e.metaKey) parts.push("Meta");
  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  parts.push(key);
  return parts.join("+");
}

type Mode = "menu" | "practice" | "edit";

export default function Home() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [mode, setMode] = useState<Mode>("menu");

  useEffect(() => {
    const saved = localStorage.getItem("shortcuts-v1");
    setShortcuts(saved ? JSON.parse(saved) : DEFAULTS);
  }, []);

  const save = (next: Shortcut[]) => {
    setShortcuts(next);
    localStorage.setItem("shortcuts-v1", JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-50">
      {mode === "menu" && (
        <Menu count={shortcuts.length} onPractice={() => setMode("practice")} onEdit={() => setMode("edit")} />
      )}
      {mode === "practice" && (
        <Practice shortcuts={shortcuts} onExit={() => setMode("menu")} />
      )}
      {mode === "edit" && (
        <EditMode shortcuts={shortcuts} onChange={save} onExit={() => setMode("menu")} />
      )}
    </div>
  );
}

function Menu({ count, onPractice, onEdit }: { count: number; onPractice: () => void; onEdit: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      <h1 className="text-5xl font-bold tracking-tight">Shortcut Trainer</h1>
      <p className="text-zinc-400">{count} 件のショートカットが登録されています</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={onPractice}
          disabled={count === 0}
          className="px-8 py-4 bg-blue-600 rounded-full text-lg font-semibold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          練習開始
        </button>
        <button
          onClick={onEdit}
          className="px-8 py-4 bg-zinc-700 rounded-full text-lg font-semibold hover:bg-zinc-600 transition-colors"
        >
          編集
        </button>
      </div>
    </div>
  );
}

function Practice({ shortcuts, onExit }: { shortcuts: Shortcut[]; onExit: () => void }) {
  const [queue] = useState(() => [...shortcuts].sort(() => Math.random() - 0.5));
  const [index, setIndex] = useState(0);
  const [pressed, setPressed] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const waiting = result !== null;
  const current = queue[index];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (waiting || !current) return;
      const combo = captureCombo(e);
      if (!combo) return;
      e.preventDefault();
      const ok = combo === current.keys;
      setPressed(combo);
      setResult(ok ? "correct" : "wrong");
      setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
      setTimeout(() => {
        if (index + 1 >= queue.length) {
          setDone(true);
        } else {
          setIndex((i) => i + 1);
          setPressed(null);
          setResult(null);
        }
      }, 1400);
    },
    [waiting, current, index, queue.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (done) {
    const pct = Math.round((score.correct / score.total) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6">
        <h2 className="text-3xl font-bold">完了</h2>
        <p className="text-7xl font-mono font-bold">
          {score.correct}
          <span className="text-zinc-500 text-4xl">/{score.total}</span>
        </p>
        <p className="text-zinc-400 text-xl">{pct}% 正解</p>
        <button
          onClick={onExit}
          className="mt-4 px-6 py-3 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors"
        >
          メニューに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-4">
      <div className="text-zinc-500 text-sm tracking-widest">
        {index + 1} / {queue.length}&nbsp;|&nbsp;{score.correct} 正解
      </div>

      <div className="text-center">
        <p className="text-zinc-400 mb-3 text-sm">このコマンドのショートカットは?</p>
        <h2 className="text-4xl font-bold">{current?.description}</h2>
      </div>

      <div className="h-20 flex flex-col items-center justify-center gap-2">
        {result === null && (
          <p className="text-zinc-500 animate-pulse">キーを押してください...</p>
        )}
        {result === "correct" && (
          <>
            <p className="text-green-400 font-bold text-xl">正解</p>
            <kbd className="px-4 py-2 bg-zinc-700 rounded-lg font-mono text-lg">{pressed}</kbd>
          </>
        )}
        {result === "wrong" && (
          <>
            <p className="text-red-400 font-bold text-xl">不正解</p>
            <div className="flex items-center gap-3">
              <kbd className="px-3 py-1 bg-red-900/40 rounded font-mono text-sm line-through opacity-60">
                {pressed}
              </kbd>
              <span className="text-zinc-500">→</span>
              <kbd className="px-3 py-1 bg-zinc-700 rounded font-mono text-sm">{current?.keys}</kbd>
            </div>
          </>
        )}
      </div>

      <button
        onClick={onExit}
        className="text-zinc-600 hover:text-zinc-400 text-sm mt-4 transition-colors"
      >
        中断して戻る
      </button>
    </div>
  );
}

function EditMode({
  shortcuts,
  onChange,
  onExit,
}: {
  shortcuts: Shortcut[];
  onChange: (s: Shortcut[]) => void;
  onExit: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [keys, setKeys] = useState("");
  const [capturing, setCapturing] = useState(false);

  const handleCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!capturing) return;
      const combo = captureCombo(e);
      if (!combo) return;
      e.preventDefault();
      setKeys(combo);
      setCapturing(false);
    },
    [capturing]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleCapture);
    return () => window.removeEventListener("keydown", handleCapture);
  }, [handleCapture]);

  const add = () => {
    if (!desc.trim() || !keys.trim()) return;
    onChange([
      ...shortcuts,
      { id: Date.now().toString(), description: desc.trim(), keys: keys.trim() },
    ]);
    setDesc("");
    setKeys("");
  };

  const remove = (id: string) => onChange(shortcuts.filter((s) => s.id !== id));

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold">ショートカット編集</h2>
        <button
          onClick={onExit}
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          &larr; 戻る
        </button>
      </div>

      <div className="bg-zinc-800 rounded-xl p-4 mb-6 flex gap-2 flex-wrap">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="説明 (例: ファイルを保存)"
          className="flex-1 min-w-36 bg-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              add();
            }
          }}
        />
        <button
          onMouseDown={() => setCapturing(true)}
          className={`px-4 py-2 rounded-lg text-sm font-mono min-w-28 transition-colors ${
            capturing ? "bg-blue-600 animate-pulse" : "bg-zinc-600 hover:bg-zinc-500"
          }`}
        >
          {capturing ? "キーを押して..." : keys || "キーを設定"}
        </button>
        <button
          onClick={add}
          disabled={!desc.trim() || !keys.trim()}
          className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          追加
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {shortcuts.length === 0 && (
          <p className="text-zinc-500 text-center py-12">まだショートカットがありません</p>
        )}
        {shortcuts.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3 gap-4"
          >
            <span className="text-sm flex-1">{s.description}</span>
            <kbd className="px-2 py-1 bg-zinc-700 rounded font-mono text-xs whitespace-nowrap">
              {s.keys}
            </kbd>
            <button
              onClick={() => remove(s.id)}
              className="text-zinc-500 hover:text-red-400 text-sm transition-colors"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
