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

export const ClassicAts: React.FC<TemplateProps> = ({
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
          phone,
          email ? (
            <a key="email" href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          ) : null,
          location,
          linkedinUrl ? (
            <a
              key="linkedin"
              href={formatHref(linkedinUrl)}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
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
              className="hover:underline"
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
              className="hover:underline"
            >
              {formatDisplayUrl(portfolioUrl)}
            </a>
          ) : null,
        ].filter(Boolean);

        return (
          <header key="contact" className="text-center pb-2 mb-3 border-b border-neutral-300">
            {fullName && (
              <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-neutral-900">
                {fullName}
              </h1>
            )}
            {contacts.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center items-center gap-x-2 text-xs text-neutral-700">
                {contacts.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-neutral-400">|</span>}
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
          <section key="summary" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Professional Summary
            </h2>
            <p className="text-xs leading-relaxed text-neutral-800 text-justify">
              {data.summary.text}
            </p>
          </section>
        );
      }

      case 'experience': {
        const items = filterVisibleItems(data.experience);
        if (items.length === 0) return null;
        return (
          <section key="experience" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Work Experience
            </h2>
            <div className="space-y-2.5">
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
                      <span className="font-bold text-neutral-900">{item.role}</span>
                      {dateRange && (
                        <span className="font-semibold text-neutral-800 text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-neutral-700 italic">
                      <span>{item.company}</span>
                      {item.location && <span>{item.location}</span>}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 space-y-0.5 text-neutral-800">
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

      case 'projects': {
        const items = filterVisibleItems(data.projects);
        if (items.length === 0) return null;
        return (
          <section key="projects" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Projects
            </h2>
            <div className="space-y-2.5">
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
                      <div className="font-bold text-neutral-900">
                        <span>{item.name}</span>
                        {item.role && (
                          <span className="font-normal text-neutral-700">
                            {' '}
                            | {item.role}
                          </span>
                        )}
                        {item.link && (
                          <a
                            href={formatHref(item.link)}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 font-normal text-neutral-600 underline hover:text-neutral-900"
                          >
                            {formatDisplayUrl(item.link)}
                          </a>
                        )}
                      </div>
                      {dateRange && (
                        <span className="text-neutral-800 font-semibold text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    {techs.length > 0 && (
                      <div className="text-[11px] text-neutral-700 italic">
                        <span className="font-semibold not-italic">
                          Technologies:{' '}
                        </span>
                        {techs.join(', ')}
                      </div>
                    )}
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 space-y-0.5 text-neutral-800">
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

      case 'education': {
        const items = filterVisibleItems(data.education);
        if (items.length === 0) return null;
        return (
          <section key="education" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Education
            </h2>
            <div className="space-y-2">
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
                        <span className="font-semibold text-neutral-800 text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-baseline text-neutral-800">
                      <span className="italic">
                        {item.degree}{' '}
                        {item.fieldOfStudy ? `in ${item.fieldOfStudy}` : ''}
                        {item.gpa ? ` (GPA: ${item.gpa})` : ''}
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

      case 'skills': {
        const items = filterVisibleItems(data.skills);
        const validItems = items.filter(
          (cat) => cat.skills && cat.skills.length > 0
        );
        if (validItems.length === 0) return null;
        return (
          <section key="skills" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Skills
            </h2>
            <div className="space-y-1 text-xs text-neutral-800">
              {validItems.map((cat) => (
                <div key={cat.id} className="leading-snug">
                  <span className="font-bold text-neutral-900">
                    {cat.categoryName}:{' '}
                  </span>
                  <span>{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'certifications': {
        const items = filterVisibleItems(data.certifications);
        if (items.length === 0) return null;
        return (
          <section key="certifications" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Certifications
            </h2>
            <div className="space-y-1.5 text-xs">
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
                        <span className="text-neutral-700">
                          {' '}
                          – {item.issuer}
                        </span>
                      )}
                      {item.credentialUrl && (
                        <a
                          href={formatHref(item.credentialUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 underline text-neutral-600 hover:text-neutral-900"
                        >
                          Credential
                        </a>
                      )}
                    </div>
                    {dateRange && (
                      <span className="font-semibold text-neutral-800 text-right">
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
          <section key="involvement" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Leadership & Involvement
            </h2>
            <div className="space-y-2 text-xs">
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
                        <span className="font-semibold text-neutral-800 text-right">
                          {dateRange}
                        </span>
                      )}
                    </div>
                    <div className="italic text-neutral-700">
                      {item.organization}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc ml-5 mt-1 space-y-0.5 text-neutral-800">
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
          <section key="awards" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Honors & Awards
            </h2>
            <div className="space-y-1.5 text-xs">
              {items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="font-bold text-neutral-900">
                        {item.title}
                      </span>
                      {item.issuer && (
                        <span className="text-neutral-700">
                          {' '}
                          – {item.issuer}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <span className="font-semibold text-neutral-800 text-right">
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
          <section key="publications" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              Publications
            </h2>
            <div className="space-y-1.5 text-xs">
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
                            className="ml-2 font-normal underline text-neutral-600 hover:text-neutral-900"
                          >
                            [Link]
                          </a>
                        )}
                      </div>
                      {item.date && (
                        <span className="font-semibold text-neutral-800 text-right">
                          {item.date}
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-700">
                      {item.publisher && (
                        <span className="italic">{item.publisher}</span>
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
          <section key="references" className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-900 pb-0.5 mb-1.5">
              References
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-neutral-200 p-2 rounded"
                >
                  <div className="font-bold text-neutral-900">{item.name}</div>
                  <div className="text-neutral-700">
                    {item.relationship} at {item.company}
                  </div>
                  <div className="text-neutral-600 text-[11px]">
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
