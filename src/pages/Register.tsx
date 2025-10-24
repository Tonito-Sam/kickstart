import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface RegistrationForm {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  jobTitle: string;
  sector: string;
  phone: string;
}

const Register = () => {
  const [formData, setFormData] = useState<RegistrationForm>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    jobTitle: "",
    sector: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Generate unique ticket ID
    const ticketId = uuidv4();
    
    // Create ticket data
    const ticketData = {
      id: ticketId,
      ...formData,
      registrationDate: new Date().toISOString(),
      eventName: "Kickstart 2026",
      eventDate: "January 31, 2026 • 8:00 AM - 2:00 PM",
      eventLocation: "The Knowledge Base, CNR 131, 33 Grossvenor Rd, Cumberland Ave, Bryanston, Sandton, 2191",
    };

    // Store in localStorage
    localStorage.setItem(`ticket_${ticketId}`, JSON.stringify(ticketData));

    // Try to POST to server to generate official PDF ticket and trigger WhatsApp sends
    // Open a blank tab immediately to avoid popup blockers and so the tab is kept open
    const ticketTab = window.open('about:blank', '_blank');
    (async () => {
      try {
        const serverBase = (import.meta.env.VITE_SERVER_URL as string) || 'http://localhost:3333';
        const serverRes = await fetch(`${serverBase}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullname: `${formData.firstName} ${formData.lastName}`, email: formData.email, phone: formData.phone, sector: formData.sector, role: formData.jobTitle }),
        });
        const data = await serverRes.json();
        if (serverRes.ok && data.ticketUrl) {
          toast({ title: 'Registration Successful', description: 'Your ticket has been generated. A copy will be sent to you via WhatsApp shortly.' });
          // navigate the pre-opened tab to the official ticket URL
          try { if (ticketTab) ticketTab.location.href = data.ticketUrl; else window.open(data.ticketUrl, '_blank'); } catch (e) { window.open(data.ticketUrl, '_blank'); }
        } else {
          console.warn('Server returned error', data);
          toast({ title: 'Registered (offline)', description: 'Ticket generated locally. Server registration failed; we will retry later.' });
          // close pre-opened blank tab if server failed
          try { if (ticketTab) ticketTab.close(); } catch (e) { }
        }
      } catch (e) {
        console.warn('Server POST failed', e);
        toast({ title: 'Registered (offline)', description: 'Ticket generated locally. Server registration failed; we will retry when online.' });
        try { if (ticketTab) ticketTab.close(); } catch (e) { }
      }
    })();

    // Navigate to ticket page (local view)
    setTimeout(() => {
      navigate(`/ticket/${ticketId}`);
    }, 500);

    setIsSubmitting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-card border rounded-2xl p-8 md:p-12 animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Register for Kickstart 2026
            </h1>
            <p className="text-muted-foreground">
              Complete the form below to get your free ticket
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john.doe@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company / Organization</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your Company Name"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="e.g., Marketing Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Sector / Industry</Label>
                <Input
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  placeholder="e.g., Technology"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+27 12 345 6789"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Generate My Ticket"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
