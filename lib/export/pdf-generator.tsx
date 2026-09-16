import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import {
  DEFAULT_SECTION_ORDER,
  ResumeData,
  SectionKey,
  TemplateId,
} from '@/types/resume';
import {
  filterVisibleItems,
  formatDateRange,
  formatDisplayUrl,
  formatHref,
} from '@/components/templates/template-helpers';

/**
 * Common stylesheet for ATS-compliant vector PDF generation.
 */
const styles = StyleSheet.create({
  page: {
    paddingTop: 36, // 0.5 inch margins
    paddingBottom: 36,
    paddingLeft: 36,
    paddingRight: 36,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#1f2937',
  },
  // Header / Contact
  headerCenter: {
    marginBottom: 10,
    alignItems: 'center',
    textAlign: 'center',
  },
  headerLeft: {
    marginBottom: 10,
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  fullName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#111827',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    fontSize: 8.5,
    color: '#4b5563',
    gap: 4,
  },
  contactRowLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    fontSize: 8.5,
    color: '#4b5563',
    gap: 4,
  },
  contactItem: {
    color: '#4b5563',
    textDecoration: 'none',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  separator: {
    color: '#9ca3af',
    marginHorizontal: 3,
  },
  // Section Headings
  sectionTitleBorder: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.75,
    color: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginTop: 8,
    marginBottom: 5,
  },
  sectionTitleClean: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.75,
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitleAccent: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.75,
    color: '#1e3a8a',
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginTop: 8,
    marginBottom: 5,
  },
  // Body Content
  summaryText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#374151',
    marginBottom: 4,
  },
  entryContainer: {
    marginBottom: 5,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 1,
  },
  entryTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    flex: 1,
  },
  entrySubtitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Oblique',
    color: '#4b5563',
  },
  entryDate: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'right',
  },
  entryLocation: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Oblique',
    color: '#6b7280',
    textAlign: 'right',
  },
  bulletList: {
    marginTop: 2,
    paddingLeft: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  bulletDot: {
    width: 8,
    fontSize: 8,
    color: '#4b5563',
  },
  bulletText: {
    flex: 1,
    fontSize: 8.75,
    lineHeight: 1.35,
    color: '#374151',
  },
  // Skills
  skillRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    fontSize: 9,
    lineHeight: 1.35,
  },
  skillCategory: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginRight: 4,
  },
  skillItems: {
    color: '#374151',
    flex: 1,
  },
  // Generic entry
  entryDesc: {
    fontSize: 8.75,
    lineHeight: 1.35,
    color: '#4b5563',
    marginTop: 1,
  },
});

interface ResumePdfDocumentProps {
  resume: ResumeData;
  templateId: TemplateId | string;
  sectionOrder: SectionKey[];
}

/**
 * Vector PDF Document Component
 */
export const ResumePdfDocument: React.FC<ResumePdfDocumentProps> = ({
  resume,
  templateId = 'classic-ats',
  sectionOrder = DEFAULT_SECTION_ORDER,
}) => {
  const isMinimal = templateId === 'modern-minimal';
  const isExecutiveAccent = templateId === 'executive-accent';

  const headingStyle = isExecutiveAccent
    ? styles.sectionTitleAccent
    : isMinimal
    ? styles.sectionTitleClean
    : styles.sectionTitleBorder;

  const headerAlignStyle = isMinimal ? styles.headerLeft : styles.headerCenter;
  const contactRowStyle = isMinimal ? styles.contactRowLeft : styles.contactRow;

  const order =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : DEFAULT_SECTION_ORDER;

  const renderSection = (key: SectionKey) => {
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
        } = resume.contact || {};

        if (!fullName && !email && !phone && !location) return null;

        const items: React.ReactNode[] = [];

        if (phone) {
          items.push(
            <Text key="phone" style={styles.contactItem}>
              {phone}
            </Text>
          );
        }
        if (email) {
          items.push(
            <Link key="email" src={`mailto:${email}`} style={styles.link}>
              {email}
            </Link>
          );
        }
        if (location) {
          items.push(
            <Text key="loc" style={styles.contactItem}>
              {location}
            </Text>
          );
        }
        if (linkedinUrl) {
          items.push(
            <Link key="li" src={formatHref(linkedinUrl)} style={styles.link}>
              {formatDisplayUrl(linkedinUrl)}
            </Link>
          );
        }
        if (githubUrl) {
          items.push(
            <Link key="gh" src={formatHref(githubUrl)} style={styles.link}>
              {formatDisplayUrl(githubUrl)}
            </Link>
          );
        }
        if (portfolioUrl) {
          items.push(
            <Link key="port" src={formatHref(portfolioUrl)} style={styles.link}>
              {formatDisplayUrl(portfolioUrl)}
            </Link>
          );
        }

        return (
          <View key="contact" style={headerAlignStyle}>
            {fullName ? <Text style={styles.fullName}>{fullName}</Text> : null}
            <View style={contactRowStyle}>
              {items.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <Text style={styles.separator}>•</Text>}
                  {item}
                </React.Fragment>
              ))}
            </View>
          </View>
        );
      }

      case 'summary': {
        if (resume.summary?.visible === false || !resume.summary?.text?.trim()) {
          return null;
        }
        return (
          <View key="summary">
            <Text style={headingStyle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{resume.summary.text}</Text>
          </View>
        );
      }

      case 'experience': {
        const items = filterVisibleItems(resume.experience);
        if (items.length === 0) return null;

        return (
          <View key="experience">
            <Text style={headingStyle}>Work Experience</Text>
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
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryTitle}>{item.role}</Text>
                    {dateRange ? (
                      <Text style={styles.entryDate}>{dateRange}</Text>
                    ) : null}
                  </View>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entrySubtitle}>{item.company}</Text>
                    {item.location ? (
                      <Text style={styles.entryLocation}>{item.location}</Text>
                    ) : null}
                  </View>
                  {bullets.length > 0 ? (
                    <View style={styles.bulletList}>
                      {bullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      }

      case 'projects': {
        const items = filterVisibleItems(resume.projects);
        if (items.length === 0) return null;

        return (
          <View key="projects">
            <Text style={headingStyle}>Projects</Text>
            {items.map((item) => {
              const dateRange = formatDateRange(item.startDate, item.endDate);
              const techs = (item.technologies || []).filter(
                (t) => t && t.trim() !== ''
              );
              const bullets = (item.bullets || []).filter(
                (b) => b && b.trim() !== ''
              );

              return (
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={styles.entryTitle}>{item.name}</Text>
                      {item.role ? (
                        <Text style={styles.entrySubtitle}> | {item.role}</Text>
                      ) : null}
                      {item.link ? (
                        <Link
                          src={formatHref(item.link)}
                          style={[styles.link, { fontSize: 8.5, marginLeft: 4 }]}
                        >
                          [{formatDisplayUrl(item.link)}]
                        </Link>
                      ) : null}
                    </View>
                    {dateRange ? (
                      <Text style={styles.entryDate}>{dateRange}</Text>
                    ) : null}
                  </View>
                  {techs.length > 0 ? (
                    <Text style={styles.entryDesc}>
                      Technologies: {techs.join(', ')}
                    </Text>
                  ) : null}
                  {bullets.length > 0 ? (
                    <View style={styles.bulletList}>
                      {bullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      }

      case 'education': {
        const items = filterVisibleItems(resume.education);
        if (items.length === 0) return null;

        return (
          <View key="education">
            <Text style={headingStyle}>Education</Text>
            {items.map((item) => {
              const dateRange = formatDateRange(item.startDate, item.endDate);
              const honors = (item.honors || []).filter(
                (h) => h && h.trim() !== ''
              );

              return (
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryTitle}>{item.institution}</Text>
                    {dateRange ? (
                      <Text style={styles.entryDate}>{dateRange}</Text>
                    ) : null}
                  </View>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entrySubtitle}>
                      {item.degree}
                      {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}
                      {item.gpa ? ` (GPA: ${item.gpa})` : ''}
                    </Text>
                    {honors.length > 0 ? (
                      <Text style={styles.entryLocation}>
                        {honors.join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      case 'skills': {
        const items = filterVisibleItems(resume.skills);
        const validItems = items.filter(
          (cat) => cat.skills && cat.skills.length > 0
        );
        if (validItems.length === 0) return null;

        return (
          <View key="skills">
            <Text style={headingStyle}>Skills</Text>
            {validItems.map((cat) => (
              <View key={cat.id} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{cat.categoryName}:</Text>
                <Text style={styles.skillItems}>{cat.skills.join(', ')}</Text>
              </View>
            ))}
          </View>
        );
      }

      case 'certifications': {
        const items = filterVisibleItems(resume.certifications);
        if (items.length === 0) return null;

        return (
          <View key="certifications">
            <Text style={headingStyle}>Certifications</Text>
            {items.map((item) => {
              const dateRange = formatDateRange(
                item.issueDate,
                item.expirationDate
              );
              return (
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={styles.entryTitle}>{item.name}</Text>
                      {item.issuer ? (
                        <Text style={styles.entrySubtitle}>
                          {' '}
                          – {item.issuer}
                        </Text>
                      ) : null}
                      {item.credentialUrl ? (
                        <Link
                          src={formatHref(item.credentialUrl)}
                          style={[styles.link, { fontSize: 8.5, marginLeft: 4 }]}
                        >
                          [Verify]
                        </Link>
                      ) : null}
                    </View>
                    {dateRange ? (
                      <Text style={styles.entryDate}>{dateRange}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        );
      }

      case 'involvement': {
        const items = filterVisibleItems(resume.involvement);
        if (items.length === 0) return null;

        return (
          <View key="involvement">
            <Text style={headingStyle}>Leadership & Involvement</Text>
            {items.map((item) => {
              const dateRange = formatDateRange(item.startDate, item.endDate);
              const bullets = (item.bullets || []).filter(
                (b) => b && b.trim() !== ''
              );

              return (
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entryTitle}>{item.role}</Text>
                    {dateRange ? (
                      <Text style={styles.entryDate}>{dateRange}</Text>
                    ) : null}
                  </View>
                  <View style={styles.entryHeaderRow}>
                    <Text style={styles.entrySubtitle}>{item.organization}</Text>
                  </View>
                  {bullets.length > 0 ? (
                    <View style={styles.bulletList}>
                      {bullets.map((bullet, bIdx) => (
                        <View key={bIdx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{bullet}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      }

      case 'awards': {
        const items = filterVisibleItems(resume.awards);
        if (items.length === 0) return null;

        return (
          <View key="awards">
            <Text style={headingStyle}>Honors & Awards</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text style={styles.entryTitle}>{item.title}</Text>
                    {item.issuer ? (
                      <Text style={styles.entrySubtitle}> – {item.issuer}</Text>
                    ) : null}
                  </View>
                  {item.date ? (
                    <Text style={styles.entryDate}>{item.date}</Text>
                  ) : null}
                </View>
                {item.description ? (
                  <Text style={styles.entryDesc}>{item.description}</Text>
                ) : null}
              </View>
            ))}
          </View>
        );
      }

      case 'publications': {
        const items = filterVisibleItems(resume.publications);
        if (items.length === 0) return null;

        return (
          <View key="publications">
            <Text style={headingStyle}>Publications</Text>
            {items.map((item) => {
              const authors = (item.authors || []).filter(
                (a) => a && a.trim() !== ''
              );
              return (
                <View key={item.id} style={styles.entryContainer}>
                  <View style={styles.entryHeaderRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text style={styles.entryTitle}>{item.title}</Text>
                      {item.url ? (
                        <Link
                          src={formatHref(item.url)}
                          style={[styles.link, { fontSize: 8.5, marginLeft: 4 }]}
                        >
                          [Link]
                        </Link>
                      ) : null}
                    </View>
                    {item.date ? (
                      <Text style={styles.entryDate}>{item.date}</Text>
                    ) : null}
                  </View>
                  {item.publisher || authors.length > 0 ? (
                    <Text style={styles.entryDesc}>
                      {item.publisher ? item.publisher : ''}
                      {authors.length > 0
                        ? `${item.publisher ? ' • ' : ''}Authors: ${authors.join(', ')}`
                        : ''}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      }

      case 'references': {
        const items = filterVisibleItems(resume.references);
        if (items.length === 0) return null;

        return (
          <View key="references">
            <Text style={headingStyle}>References</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.entryTitle}>{item.name}</Text>
                  <Text style={styles.entrySubtitle}>
                    {item.relationship} at {item.company}
                  </Text>
                </View>
                {item.contact ? (
                  <Text style={styles.entryDesc}>{item.contact}</Text>
                ) : null}
              </View>
            ))}
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Document
      title={
        resume.contact?.fullName
          ? `${resume.contact.fullName} - Resume`
          : 'Resume'
      }
      author={resume.contact?.fullName || 'Wiz Resume Builder'}
      creator="Wiz Resume Builder (@react-pdf/renderer)"
      producer="Wiz Resume Builder ATS Engine"
    >
      <Page size="A4" style={styles.page}>
        {order.map((key) => renderSection(key))}
      </Page>
    </Document>
  );
};

/**
 * Generates an ATS-compliant Vector PDF Buffer for a given resume and section sequence.
 */
export async function generateResumePdfBuffer(
  resume: ResumeData,
  templateId: TemplateId | string = 'classic-ats',
  sectionOrder: SectionKey[] = DEFAULT_SECTION_ORDER
): Promise<Buffer> {
  const doc = (
    <ResumePdfDocument
      resume={resume}
      templateId={templateId}
      sectionOrder={sectionOrder}
    />
  );
  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}
