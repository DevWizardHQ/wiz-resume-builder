'use client';

import React from 'react';
import { Globe, Mail, MapPin, Phone, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResumeStore } from '@/store/useResumeStore';

export const ContactSection: React.FC = () => {
  const contact = useResumeStore((state) => state.data.contact);
  const updateContact = useResumeStore((state) => state.updateContact);

  const handleChange = (field: keyof typeof contact, value: string) => {
    updateContact({ [field]: value });
  };

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Full Name */}
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="contact-fullName" className="text-xs">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-fullName"
              placeholder="e.g. Alex Morgan"
              value={contact?.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="contact-email" className="text-xs">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-email"
              type="email"
              placeholder="alex.morgan@example.com"
              value={contact?.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="contact-phone" className="text-xs">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-phone"
              placeholder="+1 (555) 123-4567"
              value={contact?.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="contact-location" className="text-xs">
            Location (City, State/Country)
          </Label>
          <div className="relative">
            <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-location"
              placeholder="San Francisco, CA"
              value={contact?.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* LinkedIn URL */}
        <div className="space-y-1">
          <Label htmlFor="contact-linkedin" className="text-xs">
            LinkedIn URL
          </Label>
          <div className="relative">
            <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-linkedin"
              placeholder="linkedin.com/in/alexmorgan"
              value={contact?.linkedinUrl || ''}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* GitHub URL */}
        <div className="space-y-1">
          <Label htmlFor="contact-github" className="text-xs">
            GitHub URL
          </Label>
          <div className="relative">
            <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-github"
              placeholder="github.com/alexmorgan"
              value={contact?.githubUrl || ''}
              onChange={(e) => handleChange('githubUrl', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        {/* Portfolio / Website */}
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="contact-portfolio" className="text-xs">
            Portfolio / Personal Website
          </Label>
          <div className="relative">
            <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="contact-portfolio"
              placeholder="https://alexmorgan.dev"
              value={contact?.portfolioUrl || ''}
              onChange={(e) => handleChange('portfolioUrl', e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
