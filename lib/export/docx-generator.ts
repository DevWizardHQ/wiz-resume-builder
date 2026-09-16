import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopType,
  ExternalHyperlink,
  BorderStyle,
} from 'docx';
import {
  DEFAULT_SECTION_ORDER,
  ResumeData,
  SectionKey,
} from '@/types/resume';
import {
  filterVisibleItems,
  formatDateRange,
  formatDisplayUrl,
  formatHref,
} from '@/components/templates/template-helpers';

const RIGHT_TAB_DXA = 9360; // 6.5 inches in DXA/TWIPs for right-aligned date & location

/**
 * Creates a section heading paragraph with ATS-compliant formatting and bottom border.
 */
function createSectionHeader(title: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: {
      bottom: {
        color: '111827',
        space: 2,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        bold: true,
        size: 20, // 10pt (in half-points)
        font: 'Helvetica',
        color: '111827',
      }),
    ],
  });
}

/**
 * Generates an ATS-compliant native DOCX Buffer for a given resume and section sequence.
 */
export async function generateResumeDocxBuffer(
  resume: ResumeData,
  sectionOrder: SectionKey[] = DEFAULT_SECTION_ORDER
): Promise<Buffer> {
  const order =
    sectionOrder && sectionOrder.length > 0
      ? sectionOrder
      : DEFAULT_SECTION_ORDER;

  const paragraphs: Paragraph[] = [];

  for (const key of order) {
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

        if (!fullName && !email && !phone && !location) break;

        // Full Name Heading
        if (fullName) {
          paragraphs.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [
                new TextRun({
                  text: fullName.toUpperCase(),
                  bold: true,
                  size: 32, // 16pt
                  font: 'Helvetica',
                  color: '111827',
                }),
              ],
            })
          );
        }

        // Contact info line
        const contactChildren: (TextRun | ExternalHyperlink)[] = [];
        const pushItem = (text: string, href?: string) => {
          if (contactChildren.length > 0) {
            contactChildren.push(
              new TextRun({
                text: ' | ',
                color: '9CA3AF',
                size: 18,
                font: 'Helvetica',
              })
            );
          }
          if (href) {
            contactChildren.push(
              new ExternalHyperlink({
                link: href,
                children: [
                  new TextRun({
                    text,
                    style: 'Hyperlink',
                    size: 18,
                    font: 'Helvetica',
                    color: '2563EB',
                    underline: {},
                  }),
                ],
              })
            );
          } else {
            contactChildren.push(
              new TextRun({
                text,
                size: 18,
                font: 'Helvetica',
                color: '4B5563',
              })
            );
          }
        };

        if (phone) pushItem(phone);
        if (email) pushItem(email, `mailto:${email}`);
        if (location) pushItem(location);
        if (linkedinUrl) pushItem(formatDisplayUrl(linkedinUrl), formatHref(linkedinUrl));
        if (githubUrl) pushItem(formatDisplayUrl(githubUrl), formatHref(githubUrl));
        if (portfolioUrl) pushItem(formatDisplayUrl(portfolioUrl), formatHref(portfolioUrl));

        if (contactChildren.length > 0) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 140 },
              border: {
                bottom: {
                  color: 'D1D5DB',
                  space: 4,
                  style: BorderStyle.SINGLE,
                  size: 4,
                },
              },
              children: contactChildren,
            })
          );
        }
        break;
      }

      case 'summary': {
        if (resume.summary?.visible === false || !resume.summary?.text?.trim()) {
          break;
        }
        paragraphs.push(createSectionHeader('Professional Summary'));
        paragraphs.push(
          new Paragraph({
            spacing: { before: 60, after: 120 },
            children: [
              new TextRun({
                text: resume.summary.text,
                size: 19, // 9.5pt
                font: 'Helvetica',
                color: '374151',
              }),
            ],
          })
        );
        break;
      }

      case 'experience': {
        const items = filterVisibleItems(resume.experience);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Work Experience'));

        for (const item of items) {
          const dateRange = formatDateRange(
            item.startDate,
            item.endDate,
            item.current
          );
          const bullets = (item.bullets || []).filter(
            (b) => b && b.trim() !== ''
          );

          // Role and Date
          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 100, after: 20 },
              children: [
                new TextRun({
                  text: item.role,
                  bold: true,
                  size: 20, // 10pt
                  font: 'Helvetica',
                  color: '111827',
                }),
                ...(dateRange
                  ? [
                      new TextRun({
                        text: `\t${dateRange}`,
                        bold: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '374151',
                      }),
                    ]
                  : []),
              ],
            })
          );

          // Company and Location
          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: item.company,
                  italics: true,
                  size: 18,
                  font: 'Helvetica',
                  color: '4B5563',
                }),
                ...(item.location
                  ? [
                      new TextRun({
                        text: `\t${item.location}`,
                        italics: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '6B7280',
                      }),
                    ]
                  : []),
              ],
            })
          );

          // Bullets
          for (const bullet of bullets) {
            paragraphs.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 18,
                    font: 'Helvetica',
                    color: '374151',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'projects': {
        const items = filterVisibleItems(resume.projects);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Projects'));

        for (const item of items) {
          const dateRange = formatDateRange(item.startDate, item.endDate);
          const techs = (item.technologies || []).filter(
            (t) => t && t.trim() !== ''
          );
          const bullets = (item.bullets || []).filter(
            (b) => b && b.trim() !== ''
          );

          const titleChildren: (TextRun | ExternalHyperlink)[] = [
            new TextRun({
              text: item.name,
              bold: true,
              size: 20,
              font: 'Helvetica',
              color: '111827',
            }),
          ];

          if (item.role) {
            titleChildren.push(
              new TextRun({
                text: ` | ${item.role}`,
                size: 18,
                font: 'Helvetica',
                color: '4B5563',
              })
            );
          }

          if (item.link) {
            titleChildren.push(
              new TextRun({ text: ' ' }),
              new ExternalHyperlink({
                link: formatHref(item.link),
                children: [
                  new TextRun({
                    text: formatDisplayUrl(item.link),
                    style: 'Hyperlink',
                    size: 18,
                    font: 'Helvetica',
                    color: '2563EB',
                    underline: {},
                  }),
                ],
              })
            );
          }

          if (dateRange) {
            titleChildren.push(
              new TextRun({
                text: `\t${dateRange}`,
                bold: true,
                size: 18,
                font: 'Helvetica',
                color: '374151',
              })
            );
          }

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 100, after: 20 },
              children: titleChildren,
            })
          );

          if (techs.length > 0) {
            paragraphs.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: `Technologies: ${techs.join(', ')}`,
                    italics: true,
                    size: 18,
                    font: 'Helvetica',
                    color: '4B5563',
                  }),
                ],
              })
            );
          }

          for (const bullet of bullets) {
            paragraphs.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 18,
                    font: 'Helvetica',
                    color: '374151',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'education': {
        const items = filterVisibleItems(resume.education);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Education'));

        for (const item of items) {
          const dateRange = formatDateRange(item.startDate, item.endDate);
          const honors = (item.honors || []).filter(
            (h) => h && h.trim() !== ''
          );

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 100, after: 20 },
              children: [
                new TextRun({
                  text: item.institution,
                  bold: true,
                  size: 20,
                  font: 'Helvetica',
                  color: '111827',
                }),
                ...(dateRange
                  ? [
                      new TextRun({
                        text: `\t${dateRange}`,
                        bold: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '374151',
                      }),
                    ]
                  : []),
              ],
            })
          );

          const degreeText = `${item.degree}${item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}${item.gpa ? ` (GPA: ${item.gpa})` : ''}`;

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 0, after: 60 },
              children: [
                new TextRun({
                  text: degreeText,
                  italics: true,
                  size: 18,
                  font: 'Helvetica',
                  color: '4B5563',
                }),
                ...(honors.length > 0
                  ? [
                      new TextRun({
                        text: `\t${honors.join(', ')}`,
                        italics: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '6B7280',
                      }),
                    ]
                  : []),
              ],
            })
          );
        }
        break;
      }

      case 'skills': {
        const items = filterVisibleItems(resume.skills);
        const validItems = items.filter(
          (cat) => cat.skills && cat.skills.length > 0
        );
        if (validItems.length === 0) break;

        paragraphs.push(createSectionHeader('Skills'));

        for (const cat of validItems) {
          paragraphs.push(
            new Paragraph({
              spacing: { before: 30, after: 30 },
              children: [
                new TextRun({
                  text: `${cat.categoryName}: `,
                  bold: true,
                  size: 19,
                  font: 'Helvetica',
                  color: '111827',
                }),
                new TextRun({
                  text: cat.skills.join(', '),
                  size: 19,
                  font: 'Helvetica',
                  color: '374151',
                }),
              ],
            })
          );
        }
        break;
      }

      case 'certifications': {
        const items = filterVisibleItems(resume.certifications);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Certifications'));

        for (const item of items) {
          const dateRange = formatDateRange(
            item.issueDate,
            item.expirationDate
          );
          const certChildren: (TextRun | ExternalHyperlink)[] = [
            new TextRun({
              text: item.name,
              bold: true,
              size: 19,
              font: 'Helvetica',
              color: '111827',
            }),
          ];

          if (item.issuer) {
            certChildren.push(
              new TextRun({
                text: ` – ${item.issuer}`,
                size: 18,
                font: 'Helvetica',
                color: '4B5563',
              })
            );
          }

          if (item.credentialUrl) {
            certChildren.push(
              new TextRun({ text: ' ' }),
              new ExternalHyperlink({
                link: formatHref(item.credentialUrl),
                children: [
                  new TextRun({
                    text: '[Verify]',
                    style: 'Hyperlink',
                    size: 17,
                    font: 'Helvetica',
                    color: '2563EB',
                    underline: {},
                  }),
                ],
              })
            );
          }

          if (dateRange) {
            certChildren.push(
              new TextRun({
                text: `\t${dateRange}`,
                bold: true,
                size: 18,
                font: 'Helvetica',
                color: '374151',
              })
            );
          }

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 40, after: 40 },
              children: certChildren,
            })
          );
        }
        break;
      }

      case 'involvement': {
        const items = filterVisibleItems(resume.involvement);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Leadership & Involvement'));

        for (const item of items) {
          const dateRange = formatDateRange(item.startDate, item.endDate);
          const bullets = (item.bullets || []).filter(
            (b) => b && b.trim() !== ''
          );

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 80, after: 20 },
              children: [
                new TextRun({
                  text: item.role,
                  bold: true,
                  size: 20,
                  font: 'Helvetica',
                  color: '111827',
                }),
                ...(dateRange
                  ? [
                      new TextRun({
                        text: `\t${dateRange}`,
                        bold: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '374151',
                      }),
                    ]
                  : []),
              ],
            })
          );

          paragraphs.push(
            new Paragraph({
              spacing: { before: 0, after: 40 },
              children: [
                new TextRun({
                  text: item.organization,
                  italics: true,
                  size: 18,
                  font: 'Helvetica',
                  color: '4B5563',
                }),
              ],
            })
          );

          for (const bullet of bullets) {
            paragraphs.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 20, after: 20 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 18,
                    font: 'Helvetica',
                    color: '374151',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'awards': {
        const items = filterVisibleItems(resume.awards);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Honors & Awards'));

        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 60, after: item.description ? 20 : 40 },
              children: [
                new TextRun({
                  text: item.title,
                  bold: true,
                  size: 19,
                  font: 'Helvetica',
                  color: '111827',
                }),
                ...(item.issuer
                  ? [
                      new TextRun({
                        text: ` – ${item.issuer}`,
                        size: 18,
                        font: 'Helvetica',
                        color: '4B5563',
                      }),
                    ]
                  : []),
                ...(item.date
                  ? [
                      new TextRun({
                        text: `\t${item.date}`,
                        bold: true,
                        size: 18,
                        font: 'Helvetica',
                        color: '374151',
                      }),
                    ]
                  : []),
              ],
            })
          );

          if (item.description) {
            paragraphs.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: item.description,
                    size: 18,
                    font: 'Helvetica',
                    color: '4B5563',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'publications': {
        const items = filterVisibleItems(resume.publications);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('Publications'));

        for (const item of items) {
          const authors = (item.authors || []).filter(
            (a) => a && a.trim() !== ''
          );
          const pubChildren: (TextRun | ExternalHyperlink)[] = [
            new TextRun({
              text: item.title,
              bold: true,
              size: 19,
              font: 'Helvetica',
              color: '111827',
            }),
          ];

          if (item.url) {
            pubChildren.push(
              new TextRun({ text: ' ' }),
              new ExternalHyperlink({
                link: formatHref(item.url),
                children: [
                  new TextRun({
                    text: '[Link]',
                    style: 'Hyperlink',
                    size: 17,
                    font: 'Helvetica',
                    color: '2563EB',
                    underline: {},
                  }),
                ],
              })
            );
          }

          if (item.date) {
            pubChildren.push(
              new TextRun({
                text: `\t${item.date}`,
                bold: true,
                size: 18,
                font: 'Helvetica',
                color: '374151',
              })
            );
          }

          paragraphs.push(
            new Paragraph({
              tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB_DXA }],
              spacing: { before: 60, after: 20 },
              children: pubChildren,
            })
          );

          const metaText = `${item.publisher ? item.publisher : ''}${
            authors.length > 0
              ? `${item.publisher ? ' • ' : ''}Authors: ${authors.join(', ')}`
              : ''
          }`;

          if (metaText) {
            paragraphs.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: metaText,
                    italics: true,
                    size: 18,
                    font: 'Helvetica',
                    color: '4B5563',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'references': {
        const items = filterVisibleItems(resume.references);
        if (items.length === 0) break;

        paragraphs.push(createSectionHeader('References'));

        for (const item of items) {
          paragraphs.push(
            new Paragraph({
              spacing: { before: 60, after: 20 },
              children: [
                new TextRun({
                  text: item.name,
                  bold: true,
                  size: 19,
                  font: 'Helvetica',
                  color: '111827',
                }),
                new TextRun({
                  text: ` – ${item.relationship} at ${item.company}`,
                  size: 18,
                  font: 'Helvetica',
                  color: '4B5563',
                }),
              ],
            })
          );
          if (item.contact) {
            paragraphs.push(
              new Paragraph({
                spacing: { before: 0, after: 40 },
                children: [
                  new TextRun({
                    text: item.contact,
                    size: 17,
                    font: 'Helvetica',
                    color: '6B7280',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      default:
        break;
    }
  }

  const doc = new Document({
    title: resume.contact?.fullName ? `${resume.contact.fullName} - Resume` : 'Resume',
    creator: 'Wiz Resume Builder (Native DOCX Engine)',
    description: 'ATS-Compliant Resume generated by Wiz Resume Builder',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
