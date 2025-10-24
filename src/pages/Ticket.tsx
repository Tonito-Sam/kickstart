import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Download, ArrowLeft, Calendar, MapPin, User, Mail, Building, Phone } from "lucide-react";

interface TicketData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  sector: string;
  phone: string;
  registrationDate: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

const Ticket = () => {
  const { ticketId } = useParams();
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  useEffect(() => {
    if (ticketId) {
      const stored = localStorage.getItem(`ticket_${ticketId}`);
      if (stored) {
        setTicketData(JSON.parse(stored));
      }
    }
  }, [ticketId]);

  const handlePrint = () => {
    window.print();
  };

  if (!ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Ticket Not Found</h2>
          <p className="text-muted-foreground">The ticket you're looking for doesn't exist.</p>
          <Link to="/register">
            <Button>Register for Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="print:hidden space-y-4 mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Your Event Ticket</h1>
              <p className="text-muted-foreground">Save or print this ticket for event entry</p>
            </div>
            <Button onClick={handlePrint} size="lg">
              <Download className="w-4 h-4 mr-2" />
              Print Ticket
            </Button>
          </div>
        </div>

        {/* A5 Ticket - Portrait */}
        <div 
          className="bg-white text-gray-900 rounded-xl overflow-hidden shadow-2xl print:shadow-none mx-auto animate-fade-in"
          style={{ 
            width: '148mm',
            height: '210mm',
            maxWidth: '100%',
            aspectRatio: '148/210'
          }}
        >
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-cyan-600 p-8 text-white">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">{ticketData.eventName}</h2>
              <p className="text-lg opacity-90">Building Systems Beyond Goals</p>
              <p className="text-sm opacity-75 mt-1">Using AI to 10X Your Bottom Line in 2026</p>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-8 flex flex-col items-center justify-between h-[calc(100%-140px)]">
            {/* Attendee Info */}
            <div className="w-full space-y-6">
              <div className="text-center space-y-2 pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Attendee Name</p>
                <p className="text-3xl font-bold">{ticketData.firstName} {ticketData.lastName}</p>
              </div>

              {ticketData.company && (
                <div className="text-center space-y-2 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                  <p className="text-xl font-semibold">{ticketData.company}</p>
                </div>
              )}

              {ticketData.jobTitle && (
                <div className="text-center space-y-2 pb-4 border-b border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Job Title</p>
                  <p className="text-lg font-semibold">{ticketData.jobTitle}</p>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="bg-gradient-to-br from-purple-50 to-cyan-50 p-6 rounded-lg">
                <QRCodeSVG
                  value={`KICKSTART2026:${ticketData.id}`}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Unique Ticket Number</p>
                <p className="text-xs font-mono text-gray-700 break-all px-4">{ticketData.id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="print:hidden mt-8 text-center text-sm text-muted-foreground">
          <p>Please present this ticket (printed or digital) at the event entrance</p>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
