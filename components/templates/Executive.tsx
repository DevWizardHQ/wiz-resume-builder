import React from 'react';
import { DEFAULT_SECTION_ORDER, SectionKey } from '@/types/resume';
import { cn } from '@/lib/utils';
import {
  TemplateProps,
  filterVisibleItems,
  formatDateRange,
  formatDisplayUrl,
  formatHref,
} from './template-helpers';

export const Executive: React.FC<TemplateProps> = ({
  data,
  sectionOrder,
  className,
}) => {
  const order =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : DEFAULT_SECTION_ORDER;

  const renderSection = (key: SectionKey): React.ReactNode => {
    switch (key) {
      case 'contact': {
        const {
          fullName,
          email,
          phone,
          location,
          linkedinUrl,
          githubUrl,
          portfolioUrl,
        } = data.contact || {};

        if (!fullName && !email && !phone && !location) return null;

        const contacts = [
          phone ? <span key="phone">{phone}</span> : null,
          email ? (
            <a
              key="email"
              href={`mailto:${email}`}
              className="hover:text-neutral-900 underline-offset-2 hover:underline"
            >
              {email}
            </a>
          ) : null,
          location ? <span key="loc">{location}</span> : null,
          linkedinUrl ? (
            <a
              key="linkedin"
              href={formatHref(linkedinUrl)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 underline-offset-2 hover:underline"
            >
              {formatDisplayUrl(linkedinUrl)}
            </a>
          ) : null,
          githubUrl ? (
            <a
              key="github"
              href={formatHref(githubUrl)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 underline-offset-2 hover:underline"
            >
              {formatDisplayUrl(githubUrl)}
            </a>
          ) : null,
          portfolioUrl ? (
            <a
              key="portfolio"
              href={formatHref(portfolioUrl)}
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 underline-offset-2 hover:underline"
            >
              {formatDisplayUrl(portfolioUrl)}
            </a>
          ) : null,
        ].filter(Boolean);

        return (
          <header key="contact" className="text-center pb-3 mb-4 border-b-2 border-neutral-900">
            {fullName && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-neutral-900 uppercase">
                {fullName}
              </h1>
            )}
            {contacts.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
                {contacts.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-neutral-400 font-bold">|</span>}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </header>
        );
      }

      case 'summary': {
        if (data.summary?.visible === false || !data.summary?.text?.trim()) {
          return null;
        }
        return (
          <section key="summary" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2">
              Executive Summary
            </h2>
            <div className="bg-neutral-50 border-l-4 border-neutral-900 p-3">
              <p className="text-xs sm:text-sm italic leading-relaxed text-neutral-800">
                {data.summary.text}
              </p>
            </div>
          </section>
        );
      }

      case 'skills': {
        const items = filterVisibleItems(data.skills);
        const validItems = items.filter(
          (cat) => cat.skills && cat.skills.length > 0
        );
        if (validItems.length === 0) return null;
        return (
          <section key="skills" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Core Competencies & Skills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {validItems.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-neutral-50 border border-neutral-200 p-2 rounded"
                >
                  <div className="font-bold text-neutral-900 mb-1">
                    {cat.categoryName}
                  </div>
                  <div className="text-neutral-700 leading-relaxed">
                    {cat.skills.join(' • ')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'experience': {
        const items = filterVisibleItems(data.experience);
        if (items.length === 0) return null;
        return (
          <section key="experience" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Executive Experience
            </h2>
            <div className="space-y-3.5">
              {items.map((item) => {
                const dateRange = formatDateRange(
                  item.startDate,
                  item.endDate,
                  item.current
                );
                const bullets = (item.bullets || []).filter(
                  (b) => b && b.trim() !== ''
                );
                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold text-neutral-900 text-sm">
                        {item.role}
                      </div>
                      {dateRange && (
                        <span className="font-bold text-neutral-800 text-right text-xs">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-neutral-700 mt-0.5">
                      <span className="font-semibold">{item.company}</span>
                      {item.location && (
                        <span className="text-neutral-600 italic">
                          {item.location}
                        </span>
                      )}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-4 mt-1.5 space-y-1 text-neutral-800">
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'projects': {
        const items = filterVisibleItems(data.projects);
        if (items.length === 0) return null;
        return (
          <section key="projects" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Key Initiatives & Projects
            </h2>
            <div className="space-y-3">
              {items.map((item) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                const techs = (item.technologies || []).filter(
                  (t) => t && t.trim() !== ''
                );
                const bullets = (item.bullets || []).filter(
                  (b) => b && b.trim() !== ''
                );
                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold text-neutral-900 text-sm">
                        <span>{item.name}</span>
                        {item.role && (
                          <span className="font-normal text-neutral-700 text-xs">
                            {' '}
                            | {item.role}
                          </span>
                        )}
                        {item.link && (
                          <a
                            href={formatHref(item.link)}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 font-normal text-xs text-neutral-700 underline hover:text-neutral-900"
                          >
                            {formatDisplayUrl(item.link)}
                          </a>
                        )}
                      </div>
                      {dateRange && (
                        <span className="font-bold text-neutral-800 text-right text-xs">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {techs.length > 0 && (
                      <div className="text-[11px] text-neutral-700 mt-0.5">
                        <span className="font-semibold">Technologies: </span>
                        {techs.join(', ')}
                      </div>
                    )}
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-4 mt-1 space-y-0.5 text-neutral-800">
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'education': {
        const items = filterVisibleItems(data.education);
        if (items.length === 0) return null;
        return (
          <section key="education" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Education & Credentials
            </h2>
            <div className="space-y-2.5">
              {items.map((item) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                const honors = (item.honors || []).filter(
                  (h) => h && h.trim() !== ''
                );
                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-neutral-900">
                        {item.institution}
                      </span>
                      {dateRange && (
                        <span className="font-bold text-neutral-800 text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-neutral-800">
                      <span>
                        {item.degree}
                        {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}
                        {item.gpa ? ` • GPA: ${item.gpa}` : ''}
                      </span>
                      {honors.length > 0 && (
                        <span className="text-[11px] text-neutral-600 italic">
                          {honors.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'certifications': {
        const items = filterVisibleItems(data.certifications);
        if (items.length === 0) return null;
        return (
          <section key="certifications" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Board Certifications & Licenses
            </h2>
            <div className="space-y-2 text-xs">
              {items.map((item) => {
                const dateRange = formatDateRange(
                  item.issueDate,
                  item.expirationDate
                );
                return (
                  <div key={item.id} className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-neutral-900">
                        {item.name}
                      </span>
                      {item.issuer && (
                        <span className="text-neutral-700"> – {item.issuer}</span>
                      )}
                      {item.credentialUrl && (
                        <a
                          href={formatHref(item.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 underline text-neutral-700 hover:text-neutral-900 text-[11px]"
                        >
                          Verify Credential
                        </a>
                      )}
                    </div>
                    {dateRange && (
                      <span className="font-bold text-neutral-800 text-right">
                        {dateRange}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'involvement': {
        const items = filterVisibleItems(data.involvement);
        if (items.length === 0) return null;
        return (
          <section key="involvement" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Board & Advisory Roles
            </h2>
            <div className="space-y-2.5 text-xs">
              {items.map((item) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                const bullets = (item.bullets || []).filter(
                  (b) => b && b.trim() !== ''
                );
                return (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-neutral-900">
                        {item.role}
                      </span>
                      {dateRange && (
                        <span className="font-bold text-neutral-800 text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-700 font-semibold">
                      {item.organization}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-4 mt-1 space-y-0.5 text-neutral-800">
                        {bullets.map((bullet, idx) => (
                          <li key={idx} className="leading-snug">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'awards': {
        const items = filterVisibleItems(data.awards);
        if (items.length === 0) return null;
        return (
          <section key="awards" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Executive Honors & Distinctions
            </h2>
            <div className="space-y-2 text-xs">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-neutral-900">
                        {item.title}
                      </span>
                      {item.issuer && (
                        <span className="text-neutral-700"> – {item.issuer}</span>
                      )}
                    </div>
                    {item.date && (
                      <span className="font-bold text-neutral-800 text-right">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-neutral-700 mt-0.5">{item.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'publications': {
        const items = filterVisibleItems(data.publications);
        if (items.length === 0) return null;
        return (
          <section key="publications" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Thought Leadership & Publications
            </h2>
            <div className="space-y-2 text-xs">
              {items.map((item) => {
                const authors = (item.authors || []).filter(
                  (a) => a && a.trim() !== ''
                );
                return (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline">
                      <div className="font-bold text-neutral-900">
                        <span>{item.title}</span>
                        {item.url && (
                          <a
                            href={formatHref(item.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 font-normal underline text-neutral-700 hover:text-neutral-900 text-[11px]"
                          >
                            [Link]
                          </a>
                        )}
                      </div>
                      {item.date && (
                        <span className="font-bold text-neutral-800 text-right">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-700">
                      {item.publisher && (
                        <span className="font-semibold">{item.publisher}</span>
                      )}
                      {authors.length > 0 && (
                        <span> • Authors: {authors.join(', ')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case 'references': {
        const items = filterVisibleItems(data.references);
        if (items.length === 0) return null;
        return (
          <section key="references" className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b-2 border-neutral-900 pb-1 mb-2.5">
              Professional References
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-50 border border-neutral-200 p-2.5 rounded"
                >
                  <div className="font-bold text-neutral-900">{item.name}</div>
                  <div className="text-neutral-700">
                    {item.relationship} at {item.company}
                  </div>
                  <div className="text-neutral-600 text-[11px] mt-0.5">
                    {item.contact}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'w-full max-w-[800px] mx-auto bg-white text-neutral-900 p-8 sm:p-10 font-sans text-xs sm:text-sm leading-normal shadow-sm print:shadow-none print:p-0',
        className
      )}
    >
      {order.map((key) => renderSection(key))}
    </div>
  );
};
