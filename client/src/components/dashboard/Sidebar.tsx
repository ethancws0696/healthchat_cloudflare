import { Link } from "wouter";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWidgetScriptUrl } from "@/config";

interface SidebarProps {
  activeTab: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const tabs = [
    { 
      id: "overview", 
      name: "Dashboard", 
      href: "/dashboard",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      id: "conversations", 
      name: "Conversations", 
      href: "/dashboard/conversations",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    { 
      id: "leads", 
      name: "Leads", 
      href: "/dashboard/leads",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: "widget", 
      name: "Widget Settings", 
      href: "/dashboard/widget",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      )
    },
    { 
      id: "embed", 
      name: "Embed Code", 
      href: "/embed-code",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    { 
      id: "profile", 
      name: "Provider Profile", 
      href: "/dashboard/profile",
      icon: (
        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    }
  ];

  return (
    <div className={`flex flex-col ${expanded ? "w-64" : "w-20"} bg-white shadow-md transition-all duration-300 ease-in-out`}>
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center flex-shrink-0">
          <svg className="h-9 w-9 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334L12 2.25l-8.25 2.25 10.5 4.5 6.75-3.75z"/>
            <path d="M12.75 15.75h-4.5a.75.75 0 01-.75-.75 3 3 0 013-3h3a.75.75 0 01.75.75m0 3h-7.5c-.414 0-.75.336-.75.75a3 3 0 003 3h6a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-1.5"/>
          </svg>
          {expanded && <span className="ml-2 text-xl font-bold text-gray-900">HealthChat</span>}
        </div>
        <button 
          className={`${expanded ? "ml-auto" : "mx-auto"} p-1 rounded-md hover:bg-gray-100`}
          onClick={() => setExpanded(!expanded)}
        >
          <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            {expanded ? (
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            ) : (
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            )}
          </svg>
        </button>
      </div>

      {/* User profile section */}
      <div className={`p-4 ${expanded ? "" : "text-center"} border-b border-gray-200`}>
        <div className={`flex ${expanded ? "" : "flex-col justify-center items-center"}`}>
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-primary-600 font-medium">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          {expanded && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.companyName || "Company"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "Email"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-2 space-y-1">
        {tabs.map((tab) => (
          <Link key={tab.id} href={tab.href}>
            <a className={`
              ${activeTab === tab.id
                ? "bg-primary-50 text-primary-700 border-l-4 border-primary-500" 
                : "text-gray-700 hover:bg-gray-100 border-l-4 border-transparent"
              } 
              ${expanded ? "" : "justify-center"}
              group flex items-center px-3 py-2 text-sm font-medium rounded-md
            `}>
              <div className={activeTab === tab.id 
                ? "text-primary-500" 
                : "text-gray-400 group-hover:text-gray-500"
              }>
                {tab.icon}
              </div>
              {expanded && <span className="ml-3 truncate">{tab.name}</span>}
            </a>
          </Link>
        ))}
      </nav>

      {/* Widget embed code */}
      {expanded && (
        <div className="p-4 border-t border-b border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Widget Code
          </h3>
          <div className="bg-gray-50 p-2 rounded-md text-xs font-mono overflow-x-auto">
            <code>{`<script src="${user ? getWidgetScriptUrl(user.id) : ''}"></script>`}</code>
          </div>
          <button 
            className="mt-2 w-full flex items-center justify-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={() => {
              navigator.clipboard.writeText(`<script src="${user ? getWidgetScriptUrl(user.id) : ''}"></script>`);
            }}
          >
            <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy to clipboard
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={logout}
          className={`
            ${expanded ? "w-full justify-center" : "mx-auto"}
            group flex items-center px-3 py-2 text-sm font-medium rounded-md
            text-gray-700 hover:bg-gray-100
          `}
        >
          <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {expanded && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
}
