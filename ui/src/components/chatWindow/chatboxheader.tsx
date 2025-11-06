import { Plus, Sidebar, X } from "lucide-react";
import { Magnetic } from "@/components/ui/magnetic";
export const HeaderExtra = (
  styles: Record<string, string>,
  onNewChat: () => void,
  onToggleSidebar: () => void,
  onClose: () => void
) => {
  return (
    <div className={styles.headerActions} aria-label="Chat header actions">
      <Magnetic>
        <button
          type="button"
          className={styles.headerIconBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onNewChat();
          }}
          aria-label="新建聊天"
          title="新建聊天"
        >
          <Plus className={styles.headerIcon} />
        </button>
      </Magnetic>
      <Magnetic>
        <button
          type="button"
          className={styles.headerIconBtn}
          onClick={onToggleSidebar}
          aria-label="切换侧边栏"
          title="切换侧边栏"
        >
          <Sidebar className={styles.headerIcon} />
        </button>
      </Magnetic>
      <Magnetic>
        <button
          type="button"
          className={styles.headerIconBtn}
          onClick={onClose}
          aria-label="关闭"
          title="关闭"
        >
          <X className={styles.headerIcon} />
        </button>
      </Magnetic>
    </div>
  );
};
