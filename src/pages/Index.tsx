import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Coffee, Smartphone, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">QR Menu</span>
          </div>
          <Link to="/auth">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Digital Menus Made Simple
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create beautiful QR code menus for your cafe. Let customers scan and browse your menu instantly on their phones.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Button variant="outline" size="lg">Learn More</Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose QR Menu?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <QrCode className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Easy QR Generation</CardTitle>
              <CardDescription>
                Generate QR codes instantly for each table or location in your cafe.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Smartphone className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Mobile Optimized</CardTitle>
              <CardDescription>
                Beautiful, responsive menus that work perfectly on any device.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Customer Friendly</CardTitle>
              <CardDescription>
                No app downloads required. Customers just scan and browse.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Menu</h3>
              <p className="text-muted-foreground">
                Add your cafe details, menu categories, and items with photos and descriptions.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate QR Codes</h3>
              <p className="text-muted-foreground">
                Get unique QR codes for your tables that link directly to your menu.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Customers Scan & Order</h3>
              <p className="text-muted-foreground">
                Customers scan the QR code and browse your menu on their phones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Go Digital?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join hundreds of cafes already using QR Menu to serve their customers better.
        </p>
        <Link to="/auth">
          <Button size="lg">Get Started Today</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 QR Menu. Making dining digital.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
