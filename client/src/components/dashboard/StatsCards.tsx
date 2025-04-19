import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  visitorId: string;
  messages: ChatMessage[];
  startedAt: string;
  endedAt: string | null;
  isQualified: boolean;
}

interface Lead {
  id: number;
  name: string;
  email: string;
  status: string;
  qualifiedAt: string;
}

interface StatsCardsProps {
  leads: Lead[];
  conversations: Conversation[];
  isLoading: boolean;
}

export default function StatsCards({ leads, conversations, isLoading }: StatsCardsProps) {
  // Calculate stats
  const totalConversations = conversations.length;
  const totalLeads = leads.length;
  
  // Conversations in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentConversations = conversations.filter(
    conv => new Date(conv.startedAt) > thirtyDaysAgo
  ).length;
  
  const recentLeads = leads.filter(
    lead => new Date(lead.qualifiedAt) > thirtyDaysAgo
  ).length;

  // Calculate conversion rate
  const conversionRate = totalConversations > 0 
    ? ((totalLeads / totalConversations) * 100).toFixed(1) 
    : "0.0";
  
  // Calculate growth percentages
  const conversationGrowth = totalConversations > 0 
    ? ((recentConversations / totalConversations) * 100).toFixed(0)
    : "0";
  
  const leadGrowth = totalLeads > 0 
    ? ((recentLeads / totalLeads) * 100).toFixed(0)
    : "0";

  // Calculate average response time (placeholder for now)
  const responseTime = "1.2s";
  const responseTimeImprovement = "14";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white overflow-hidden shadow">
            <CardContent className="px-4 py-5 sm:p-6">
              <div className="h-24 flex items-center justify-center">
                <div className="animate-pulse bg-gray-200 rounded-md h-16 w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Conversations",
      value: totalConversations.toString(),
      change: conversationGrowth,
      isPositive: true,
      icon: (
        <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      bgColor: "bg-primary-100",
    },
    {
      title: "Qualified Leads",
      value: totalLeads.toString(),
      change: leadGrowth,
      isPositive: true,
      icon: (
        <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      bgColor: "bg-green-100",
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      change: "5.4",
      isPositive: true,
      icon: (
        <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      bgColor: "bg-blue-100",
    },
    {
      title: "Avg. Response Time",
      value: responseTime,
      change: responseTimeImprovement,
      isPositive: true,
      icon: (
        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white overflow-hidden shadow">
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.title}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg className={`self-center flex-shrink-0 h-5 w-5 ${
                      stat.isPositive ? 'text-green-500' : 'text-red-500'
                    }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d={
                        stat.isPositive
                          ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                      } clipRule="evenodd" />
                    </svg>
                    <span className="sr-only">{stat.isPositive ? 'Increased' : 'Decreased'} by</span>
                    {stat.change}%
                  </div>
                </dd>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
