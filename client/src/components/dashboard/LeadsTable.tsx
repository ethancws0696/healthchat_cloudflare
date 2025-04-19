import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  interest: string;
  status: string;
  qualifiedAt: string;
  followedUpAt: string | null;
  conversation: any[];
}

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  isPreview: boolean;
}

export default function LeadsTable({ leads, isLoading, isPreview }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Format date in a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">New Lead</Badge>;
      case 'contacted':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Contacted</Badge>;
      case 'qualified':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Qualified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Follow-up</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  // Handle lead status update
  const updateLeadStatus = async (leadId: number, newStatus: string) => {
    setUpdating(true);
    try {
      await apiRequest('PUT', `/api/leads/${leadId}/status`, { status: newStatus });
      
      toast({
        title: "Status Updated",
        description: "Lead status has been successfully updated",
      });
      
      // Refresh lead data
      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update lead status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle lead view
  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDialog(true);
  };

  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-8 sm:p-10 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No leads found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start engaging with your website visitors to generate qualified leads.
          </p>
        </div>
      </div>
    );
  }

  // Display the table with leads data
  return (
    <>
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isPreview ? "Recent Leads" : "All Leads"}
          </h3>
          {isPreview && (
            <a href="/dashboard/leads" className="text-sm text-primary-600 hover:text-primary-800">
              View all leads
            </a>
          )}
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(isPreview ? leads.slice(0, 5) : leads).map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">{getInitials(lead.name)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.email}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.interest}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(lead.qualifiedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        className="text-primary-600 hover:text-primary-800"
                        onClick={() => handleViewLead(lead)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lead detail dialog */}
      {selectedLead && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>
                Review lead information and manage status
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Name</h4>
                  <p className="mt-1 text-sm">{selectedLead.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p className="mt-1 text-sm">{selectedLead.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                  <p className="mt-1 text-sm">{selectedLead.phone || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Interest</h4>
                  <p className="mt-1 text-sm">{selectedLead.interest}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Qualified On</h4>
                  <p className="mt-1 text-sm">{formatDate(selectedLead.qualifiedAt)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Conversation Summary</h4>
                <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto text-sm">
                  {selectedLead.conversation && selectedLead.conversation.length > 0 ? (
                    selectedLead.conversation.map((msg, idx) => (
                      <div key={idx} className={`mb-2 ${msg.role === "user" ? "pl-4 border-l-2 border-primary-300" : ""}`}>
                        <p className="text-xs text-gray-500 font-medium">
                          {msg.role === "user" ? "Visitor" : "Assistant"}:
                        </p>
                        <p className="text-gray-700">{msg.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No conversation history available</p>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updating || selectedLead.status === "new"}
                  onClick={() => updateLeadStatus(selectedLead.id, "new")}
                >
                  Mark as New
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updating || selectedLead.status === "contacted"}
                  onClick={() => updateLeadStatus(selectedLead.id, "contacted")}
                >
                  Mark Contacted
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updating || selectedLead.status === "closed"}
                  onClick={() => updateLeadStatus(selectedLead.id, "closed")}
                >
                  Mark Closed
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setShowDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
