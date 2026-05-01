import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Quote, 
  Code, 
  Table, 
  Image as ImageIcon,
  Divide,
  ChevronRight
} from 'lucide-react';

interface CommandListProps {
  items: any[];
  command: (item: any) => void;
}

export const CommandList = forwardRef((props: CommandListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
    if (event.key === 'ArrowUp') {
      setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
      return true;
    }

    if (event.key === 'ArrowDown') {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
      return true;
    }

    if (event.key === 'Enter') {
      selectItem(selectedIndex);
      return true;
    }

    return false;
  };

  useImperativeHandle(ref, () => ({
    onKeyDown,
  }));

  useEffect(() => setSelectedIndex(0), [props.items]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-1 min-w-[280px] z-[9999] overflow-hidden"
    >
      <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800 mb-1">
        Commands
      </div>
      <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
        {props.items.length > 0 ? (
          props.items.map((item, index) => (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                index === selectedIndex 
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'bg-neutral-100 dark:bg-neutral-800'}`}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate max-w-[160px]">{item.description}</div>
                </div>
              </div>
              {index === selectedIndex && (
                <ChevronRight size={14} className="text-neutral-300" />
              )}
            </button>
          ))
        ) : (
          <div className="px-3 py-4 text-center text-sm text-neutral-400 italic">No results</div>
        )}
      </div>
    </motion.div>
  );
});

CommandList.displayName = 'CommandList';
