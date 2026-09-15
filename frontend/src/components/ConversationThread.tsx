/* Rich conversation thread viewer with modern chat bubble design */

import {
  makeStyles,
  tokens,
  Avatar,
  Body1Strong,
  Caption1,
} from "@fluentui/react-components";
import { AttachRegular, ThumbLikeRegular } from "@fluentui/react-icons";
import type { Message } from "../types";

const useStyles = makeStyles({
  thread: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingLeft: "24px",
  },
  threadLine: {
    left: "19px",
    top: "48px",
    bottom: "24px",
    width: "2px",
    background: "linear-gradient(180deg, #6366f1 0%, #e2e8f0 100%)",
    borderRadius: "2px",
  },
  message: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "18px 20px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s ease",
    marginLeft: "20px",
    ":hover": {
      boxShadow: "0 4px 12px rgba(99,102,241,0.06)",
    },
  },
  rootMessage: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "20px 22px",
    border: "2px solid #e0e7ff",
    background: "linear-gradient(135deg, #ffffff 0%, #f8faff 100%)",
    marginLeft: "20px",
    boxShadow: "0 4px 16px rgba(99,102,241,0.06)",
  },
  messageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  messageSender: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
  },
  messageBody: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#334155",
    marginLeft: "42px",
  },
  attachments: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
    marginTop: "12px",
    marginLeft: "42px",
  },
  attachment: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    fontSize: "12px",
    color: "#475569",
    fontWeight: 500,
    border: "1px solid #e2e8f0",
    transition: "all 0.15s ease",
    ":hover": {
      backgroundColor: "#e2e8f0",
    },
  },
  reactions: {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
    marginLeft: "42px",
  },
  reactionPill: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px",
    borderRadius: "16px",
    backgroundColor: "#fef3c7",
    fontSize: "12px",
    fontWeight: 600,
    color: "#92400e",
    border: "1px solid #fde68a",
  },
  dot: {
    position: "absolute" as const,
    left: "-29px",
    top: "24px",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "3px solid #ffffff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  rootDot: {
    backgroundColor: "#6366f1",
  },
  replyDot: {
    backgroundColor: "#94a3b8",
  },
});

interface Props {
  messages: Message[];
}

export default function ConversationThread({ messages }: Props) {
  const styles = useStyles();

  return (
    <div className={styles.thread}>
      <div className={styles.threadLine} />
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={msg.is_root ? styles.rootMessage : styles.message}
        >
          <div
            className={styles.dot}
            style={{ backgroundColor: msg.is_root ? "#6366f1" : "#94a3b8" }}
          />
          <div className={styles.messageHeader}>
            <Avatar
              name={msg.from_user?.name ?? "Unknown"}
              size={32}
              color="colorful"
            />
            <div className={styles.messageSender}>
              <Body1Strong style={{ fontSize: "13px" }}>
                {msg.from_user?.name ?? "Unknown"}
              </Body1Strong>
              <Caption1 style={{ color: "#94a3b8", fontSize: "11px" }}>
                {msg.sent_datetime
                  ? new Date(msg.sent_datetime).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : ""}
              </Caption1>
            </div>
          </div>

          <div className={styles.messageBody}>
            {msg.body || msg.body_preview}
          </div>

          {msg.attachments.length > 0 && (
            <div className={styles.attachments}>
              {msg.attachments.map((att) => (
                <span key={att.name} className={styles.attachment}>
                  <AttachRegular fontSize={13} />
                  {att.name}
                </span>
              ))}
            </div>
          )}

          {msg.reactions &&
            Object.entries(msg.reactions).some(([, v]) => v > 0) && (
              <div className={styles.reactions}>
                {Object.entries(msg.reactions).map(([type, count]) =>
                  count > 0 ? (
                    <span key={type} className={styles.reactionPill}>
                      <ThumbLikeRegular fontSize={12} /> {count}
                    </span>
                  ) : null,
                )}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
