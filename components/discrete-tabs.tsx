"use client";

import { SetStateAction, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";

const Calendar: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  className,
  size = 20,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={className}
      {...props}
    >
      <g fill="currentColor">
        <path d="M5.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H6a.75.75 0 0 1-.75-.75V12ZM6 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H6ZM7.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75V12ZM8 13.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H8ZM9.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V10Zm.75 1.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10ZM9.25 14a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H10a.75.75 0 0 1-.75-.75V14ZM12 9.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V10a.75.75 0 0 0-.75-.75H12ZM11.25 12a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V12Zm.75 1.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75H12ZM13.25 10a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H14a.75.75 0 0 1-.75-.75V10Zm.75 1.25a.75.75 0 0 0-.75.75v.01c0 .414.336.75.75.75h.01a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H14Z" />
        <path
          fillRule="evenodd"
          d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
          clipRule="evenodd"
        />
      </g>
    </svg>
  );
};

const Alert: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  className,
  size = 20,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M17.1 12.6v-1.8A5.4 5.4 0 0 0 13 5.6V3a1 1 0 0 0-2 0v2.4a5.4 5.4 0 0 0-4 5.5v1.8c0 2.4-1.9 3-1.9 4.2c0 .6 0 1.2.5 1.2h13c.5 0 .5-.6.5-1.2c0-1.2-1.9-1.8-1.9-4.2ZM8.8 19a3.5 3.5 0 0 0 6.4 0z"
      />
    </svg>
  );
};

const Inbox: React.FC<React.SVGProps<SVGSVGElement> & { size?: number }> = ({
  className,
  size = 20,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...props}
    >
      <g id="evaEmailFill0">
        <g id="evaEmailFill1">
          <path
            id="evaEmailFill2"
            fill="currentColor"
            d="M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm0 2l-6.5 4.47a1 1 0 0 1-1 0L5 6Z"
          />
        </g>
      </g>
    </svg>
  );
};

const TABS = [
  { id: "Aadesh", title: "Aadesh Gavhane", url: "https://github.com/0xaadesh", avatar: "https://github.com/0xaadesh.png" },
  { id: "Kartika", title: "Kartika Thite", url: "https://github.com/Kartika2005", avatar: "https://github.com/Kartika2005.png" },
  { id: "Pooja", title: "Pooja Maskare", url: "https://github.com/poojamaskare", avatar: "https://github.com/poojamaskare.png" },
  { id: "Siddhi", title: "Siddhi Jadhav", url: "https://github.com/SiddhiJadhav13", avatar: "https://github.com/SiddhiJadhav13.png" },
];

export default function DiscreteTabs() {
  const [activeButton, setActiveButton] = useState(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === activeButton);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2 sm:gap-4 items-center flex-wrap justify-center">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            id={tab.id}
            title={tab.title}
            avatarUrl={tab.avatar}
            isActive={activeButton === tab.id}
            setActiveButton={setActiveButton}
          />
        ))}
      </div>
      {activeTab && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeTab.id}
        >
          <a
            href={activeTab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-2"
          >
            <Github className="w-4 h-4" />
            View {activeTab.title.split(' ')[0]}'s GitHub
          </a>
        </motion.div>
      )}
    </div>
  );
}

function Button({
  id,
  title,
  avatarUrl,
  isActive,
  setActiveButton,
}: {
  id: string;
  title: string;
  avatarUrl: string;
  isActive: boolean;
  setActiveButton: React.Dispatch<SetStateAction<string>>;
}) {
  const [showShine, setShowShine] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isActive && isLoaded) {
      setShowShine(true);
      const timer = setTimeout(() => setShowShine(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isActive, isLoaded]);

  const activeColor = "text-white";

  return (
    <motion.div
      layoutId={"button-id-" + title}
      transition={{
        layout: {
          type: "spring",
          damping: 20,
          stiffness: 230,
          mass: 1.2,
          ease: [0.215, 0.61, 0.355, 1],
        },
      }}
      onClick={() => {
        setActiveButton(id), setIsLoaded(true);
      }}
      className="w-fit h-fit flex"
      style={{ willChange: "transform" }}
    >
      <motion.div
        layout
        transition={{
          layout: {
            type: "spring",
            damping: 20,
            stiffness: 230,
            mass: 1.2,
          },
        }}
        className={cn(
          "flex items-center font-mono uppercase gap-1.5 bg-secondary outline outline-2 outline-background overflow-hidden shadow-md transition-colors duration-75 ease-out p-3 cursor-pointer text-white",
          isActive && activeColor,
          isActive ? "px-4" : "px-3"
        )}
        style={{
          borderRadius: "25px",
          //   paddingTop: "12px",
          //   paddingBottom: "12px",
          //   paddingLeft: isActive ? "15px" : "12px",
          //   paddingRight: isActive ? "15px" : "12px",
        }}
      >
        <motion.div
          layoutId={"icon-id" + title}
          className="shrink-0"
          style={{ willChange: "transform" }}
        >
          <img
            src={avatarUrl}
            alt={title}
            className="w-16 h-16 rounded-full object-cover"
          />
        </motion.div>
        {isActive && (
          <motion.div
            className="flex items-center"
            initial={isLoaded ? { opacity: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: isLoaded ? 0.2 : 0,
              ease: [0.86, 0, 0.07, 1],
            }}
          >
            <motion.span
              layoutId={"text-id-" + title}
              className="text-sm font-medium font-mono uppercase whitespace-nowrap relative inline-block"
              style={{ willChange: "transform" }}
            >
              {title}
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
