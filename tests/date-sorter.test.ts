import { describe, it, expect } from 'vitest';
import {
  parseDateScore,
  compareDateScores,
  sortExperiencesByDate,
  sortProjectsByDate,
  sortEducationByDate,
  sortInvolvementsByDate,
  sortCertificationsByDate,
  sortAwardsByDate,
  sortPublicationsByDate,
} from '@/lib/utils/date-sorter';
import {
  AwardItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  InvolvementItem,
  ProjectItem,
  PublicationItem,
} from '@/types/resume';

describe('Date Sorter Utility (lib/utils/date-sorter.ts)', () => {
  describe('parseDateScore', () => {
    it('returns MAX_SAFE_INTEGER when isCurrent is true regardless of date string', () => {
      expect(parseDateScore('2020-01', true)).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('', true)).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore(undefined, true)).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore(null, true)).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('returns MAX_SAFE_INTEGER for present / current / ongoing keywords', () => {
      expect(parseDateScore('Present')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('present')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('Current')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('current')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('Now')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('Ongoing')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('In Progress')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('Active')).toBe(Number.MAX_SAFE_INTEGER);
      expect(parseDateScore('Present (Full-time)')).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('returns -Infinity for empty, undefined, null, or whitespace-only strings', () => {
      expect(parseDateScore('')).toBe(-Infinity);
      expect(parseDateScore('   ')).toBe(-Infinity);
      expect(parseDateScore(undefined)).toBe(-Infinity);
      expect(parseDateScore(null)).toBe(-Infinity);
    });

    it('correctly parses ISO formats (YYYY-MM and YYYY-MM-DD)', () => {
      const score202403 = parseDateScore('2024-03');
      const score202404 = parseDateScore('2024-04');
      const score20240315 = parseDateScore('2024-03-15');

      expect(score202403).toBe(Date.UTC(2024, 2, 1));
      expect(score202404).toBe(Date.UTC(2024, 3, 1));
      expect(score20240315).toBe(Date.UTC(2024, 2, 15));
      expect(score202404).toBeGreaterThan(score202403);
      expect(score20240315).toBeGreaterThan(score202403);
    });

    it('correctly parses 4-digit years (YYYY)', () => {
      const score2024 = parseDateScore('2024');
      const score1998 = parseDateScore('1998');
      const score2005 = parseDateScore('2005');

      expect(score2024).toBe(Date.UTC(2024, 0, 1));
      expect(score1998).toBe(Date.UTC(1998, 0, 1));
      expect(score2005).toBe(Date.UTC(2005, 0, 1));
      expect(score2024).toBeGreaterThan(score2005);
      expect(score2005).toBeGreaterThan(score1998);
    });

    it('correctly parses slash and dash formats (MM/YYYY, M/YYYY, YYYY/MM)', () => {
      const scoreSlash1 = parseDateScore('05/2023');
      const scoreSlash2 = parseDateScore('5/2023');
      const scoreDash = parseDateScore('05-2023');
      const scoreYearMonth = parseDateScore('2023/05');

      expect(scoreSlash1).toBe(Date.UTC(2023, 4, 1));
      expect(scoreSlash2).toBe(Date.UTC(2023, 4, 1));
      expect(scoreDash).toBe(Date.UTC(2023, 4, 1));
      expect(scoreYearMonth).toBe(Date.UTC(2023, 4, 1));
    });

    it('correctly parses Month Year string formats (e.g. "May 2023", "Jan 2022", "September 2021")', () => {
      const scoreMay2023 = parseDateScore('May 2023');
      const scoreJan2022 = parseDateScore('Jan 2022');
      const scoreSept2021 = parseDateScore('September 2021');

      expect(scoreMay2023).toBe(Date.UTC(2023, 4, 1));
      expect(scoreJan2022).toBe(Date.UTC(2022, 0, 1));
      expect(scoreSept2021).toBe(Date.UTC(2021, 8, 1));
      expect(scoreMay2023).toBeGreaterThan(scoreJan2022);
      expect(scoreJan2022).toBeGreaterThan(scoreSept2021);
    });

    it('handles prefixed date strings like "Expected May 2026" and "Expected 2026"', () => {
      const scoreExpectedMay = parseDateScore('Expected May 2026');
      const scoreExpectedYear = parseDateScore('Expected 2026');
      const scoreGraduation = parseDateScore('Class of 2025');

      expect(scoreExpectedMay).toBe(Date.UTC(2026, 4, 1));
      expect(scoreExpectedYear).toBe(Date.UTC(2026, 0, 1));
      expect(scoreGraduation).toBe(Date.UTC(2025, 0, 1));
      expect(scoreExpectedMay).toBeGreaterThan(scoreExpectedYear);
      expect(scoreExpectedYear).toBeGreaterThan(scoreGraduation);
    });

    it('returns -Infinity for completely invalid or unparseable text', () => {
      expect(parseDateScore('invalid-date')).toBe(-Infinity);
      expect(parseDateScore('N/A')).toBe(-Infinity);
      expect(parseDateScore('unknown')).toBe(-Infinity);
    });
  });

  describe('compareDateScores', () => {
    it('returns -1 when scoreA is higher than scoreB (A is newer)', () => {
      expect(compareDateScores(2000, 1000)).toBe(-1);
      expect(compareDateScores(Number.MAX_SAFE_INTEGER, 2024)).toBe(-1);
      expect(compareDateScores(2020, -Infinity)).toBe(-1);
    });

    it('returns 1 when scoreA is lower than scoreB (B is newer)', () => {
      expect(compareDateScores(1000, 2000)).toBe(1);
      expect(compareDateScores(2024, Number.MAX_SAFE_INTEGER)).toBe(1);
      expect(compareDateScores(-Infinity, 2020)).toBe(1);
    });

    it('returns 0 when scores are equal, including -Infinity and MAX_SAFE_INTEGER', () => {
      expect(compareDateScores(1000, 1000)).toBe(0);
      expect(compareDateScores(-Infinity, -Infinity)).toBe(0);
      expect(compareDateScores(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(0);
    });
  });

  describe('sortExperiencesByDate', () => {
    const sampleExperiences: ExperienceItem[] = [
      {
        id: 'exp-1',
        visible: true,
        order: 0,
        company: 'Old Corp',
        role: 'Junior Dev',
        startDate: '2019-01',
        endDate: '2020-05',
        current: false,
        bullets: ['Did tasks'],
      },
      {
        id: 'exp-2',
        visible: true,
        order: 1,
        company: 'Active Tech',
        role: 'Senior Dev',
        startDate: '2023-01',
        endDate: '',
        current: true,
        bullets: ['Leading team'],
      },
      {
        id: 'exp-3',
        visible: true,
        order: 2,
        company: 'Mid Tech',
        role: 'Mid Dev',
        startDate: '2020-06',
        endDate: '2022-12',
        current: false,
        bullets: ['Built services'],
      },
      {
        id: 'exp-4',
        visible: true,
        order: 3,
        company: 'Co-Founding',
        role: 'CTO',
        startDate: '2024-01',
        endDate: 'Present',
        current: false, // endDate is 'Present'
        bullets: ['Founded startup'],
      },
    ];

    it('prioritizes current: true and endDate: "Present" to the top', () => {
      const sorted = sortExperiencesByDate(sampleExperiences);
      const ids = sorted.map((item) => item.id);

      // Both exp-4 (start 2024-01, Present) and exp-2 (start 2023-01, current: true) are at the top
      // exp-4 started more recently (2024-01 vs 2023-01), so exp-4 comes first, then exp-2
      expect(ids.slice(0, 2)).toEqual(['exp-4', 'exp-2']);
      // Past jobs ordered descending by endDate: exp-3 (2022-12) then exp-1 (2020-05)
      expect(ids.slice(2)).toEqual(['exp-3', 'exp-1']);
    });

    it('breaks ties using start date descending when end dates are equal', () => {
      const tieExperiences: ExperienceItem[] = [
        {
          id: 'exp-tie-older-start',
          visible: true,
          order: 0,
          company: 'Company A',
          role: 'Engineer',
          startDate: '2021-01',
          endDate: '2023-06',
          current: false,
          bullets: [],
        },
        {
          id: 'exp-tie-newer-start',
          visible: true,
          order: 1,
          company: 'Company B',
          role: 'Engineer',
          startDate: '2022-01',
          endDate: '2023-06',
          current: false,
          bullets: [],
        },
      ];

      const sorted = sortExperiencesByDate(tieExperiences);
      expect(sorted[0].id).toBe('exp-tie-newer-start');
      expect(sorted[1].id).toBe('exp-tie-older-start');
    });

    it('re-indexes the order field sequentially from 0', () => {
      const sorted = sortExperiencesByDate(sampleExperiences);
      expect(sorted.map((item) => item.order)).toEqual([0, 1, 2, 3]);
    });

    it('does not mutate the original input array or its item objects', () => {
      const originalCopy = JSON.parse(JSON.stringify(sampleExperiences));
      const sorted = sortExperiencesByDate(sampleExperiences);

      expect(sampleExperiences).toEqual(originalCopy);
      expect(sorted).not.toBe(sampleExperiences);
      expect(sorted[0]).not.toBe(sampleExperiences[0]);
    });

    it('handles empty arrays gracefully', () => {
      const sorted = sortExperiencesByDate([]);
      expect(sorted).toEqual([]);
    });

    it('places items with missing or empty dates at the bottom', () => {
      const itemsWithMissingDates: ExperienceItem[] = [
        {
          id: 'exp-no-dates',
          visible: true,
          order: 0,
          company: 'Mystery Corp',
          role: 'Advisor',
          startDate: '',
          endDate: '',
          current: false,
          bullets: [],
        },
        {
          id: 'exp-valid',
          visible: true,
          order: 1,
          company: 'Known Corp',
          role: 'Engineer',
          startDate: '2021-01',
          endDate: '2022-01',
          current: false,
          bullets: [],
        },
      ];

      const sorted = sortExperiencesByDate(itemsWithMissingDates);
      expect(sorted[0].id).toBe('exp-valid');
      expect(sorted[1].id).toBe('exp-no-dates');
      expect(sorted[0].order).toBe(0);
      expect(sorted[1].order).toBe(1);
    });
  });

  describe('sortProjectsByDate', () => {
    const sampleProjects: ProjectItem[] = [
      {
        id: 'proj-1',
        visible: true,
        order: 0,
        name: 'Legacy Project',
        startDate: '2020-01',
        endDate: '2020-06',
        technologies: ['React'],
        bullets: ['Built UI'],
      },
      {
        id: 'proj-2',
        visible: true,
        order: 1,
        name: 'Ongoing SaaS',
        startDate: '2023-06',
        endDate: 'Present',
        technologies: ['Next.js'],
        bullets: ['Live in production'],
      },
      {
        id: 'proj-3',
        visible: true,
        order: 2,
        name: 'Recent Project',
        startDate: '2022-01',
        endDate: '2023-01',
        technologies: ['TypeScript'],
        bullets: ['CLI tool'],
      },
    ];

    it('sorts projects reverse-chronologically with Present at top', () => {
      const sorted = sortProjectsByDate(sampleProjects);
      expect(sorted.map((p) => p.id)).toEqual(['proj-2', 'proj-3', 'proj-1']);
      expect(sorted.map((p) => p.order)).toEqual([0, 1, 2]);
    });

    it('breaks ties using startDate when endDates are identical', () => {
      const tieProjects: ProjectItem[] = [
        {
          id: 'proj-early',
          visible: true,
          order: 0,
          name: 'Early Project',
          startDate: '2021-01',
          endDate: '2022-12',
          technologies: [],
          bullets: [],
        },
        {
          id: 'proj-late',
          visible: true,
          order: 1,
          name: 'Late Project',
          startDate: '2022-06',
          endDate: '2022-12',
          technologies: [],
          bullets: [],
        },
      ];

      const sorted = sortProjectsByDate(tieProjects);
      expect(sorted[0].id).toBe('proj-late');
      expect(sorted[1].id).toBe('proj-early');
    });

    it('does not mutate the original array and updates order correctly', () => {
      const copy = [...sampleProjects];
      const sorted = sortProjectsByDate(sampleProjects);
      expect(sampleProjects).toEqual(copy);
      expect(sorted.map((p) => p.order)).toEqual([0, 1, 2]);
    });

    it('handles projects with missing or empty dates', () => {
      const missingDateProjects: ProjectItem[] = [
        {
          id: 'proj-no-dates',
          visible: true,
          order: 0,
          name: 'Undated Project',
          technologies: [],
          bullets: [],
        },
        {
          id: 'proj-dated',
          visible: true,
          order: 1,
          name: 'Dated Project',
          startDate: '2023-01',
          endDate: '2023-08',
          technologies: [],
          bullets: [],
        },
      ];

      const sorted = sortProjectsByDate(missingDateProjects);
      expect(sorted[0].id).toBe('proj-dated');
      expect(sorted[1].id).toBe('proj-no-dates');
    });
  });

  describe('sortEducationByDate', () => {
    const sampleEducation: EducationItem[] = [
      {
        id: 'edu-1',
        visible: true,
        order: 0,
        institution: 'State University',
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        startDate: '2016-08',
        endDate: '2020-05',
      },
      {
        id: 'edu-2',
        visible: true,
        order: 1,
        institution: 'Tech Institute',
        degree: 'M.S.',
        fieldOfStudy: 'AI & Robotics',
        startDate: '2022-09',
        endDate: 'Expected May 2026',
      },
      {
        id: 'edu-3',
        visible: true,
        order: 2,
        institution: 'Community College',
        degree: 'A.S.',
        fieldOfStudy: 'Mathematics',
        startDate: '2014-08',
        endDate: '2016-05',
      },
    ];

    it('sorts education by graduation/end date descending (future/expected dates first)', () => {
      const sorted = sortEducationByDate(sampleEducation);
      expect(sorted.map((e) => e.id)).toEqual(['edu-2', 'edu-1', 'edu-3']);
      expect(sorted.map((e) => e.order)).toEqual([0, 1, 2]);
    });

    it('breaks ties using startDate when endDates match', () => {
      const tieEdu: EducationItem[] = [
        {
          id: 'edu-longer',
          visible: true,
          order: 0,
          institution: 'School A',
          degree: 'Certificate',
          fieldOfStudy: 'Web',
          startDate: '2019-01',
          endDate: '2020-12',
        },
        {
          id: 'edu-shorter',
          visible: true,
          order: 1,
          institution: 'School B',
          degree: 'Certificate',
          fieldOfStudy: 'Cloud',
          startDate: '2020-06',
          endDate: '2020-12',
        },
      ];

      const sorted = sortEducationByDate(tieEdu);
      expect(sorted[0].id).toBe('edu-shorter');
      expect(sorted[1].id).toBe('edu-longer');
    });

    it('does not mutate original education items and renumbers order', () => {
      const copy = JSON.parse(JSON.stringify(sampleEducation));
      const sorted = sortEducationByDate(sampleEducation);
      expect(sampleEducation).toEqual(copy);
      expect(sorted.map((e) => e.order)).toEqual([0, 1, 2]);
    });
  });

  describe('sortInvolvementsByDate', () => {
    const sampleInvolvements: InvolvementItem[] = [
      {
        id: 'inv-1',
        visible: true,
        order: 0,
        organization: 'Open Source Club',
        role: 'Member',
        startDate: '2018-09',
        endDate: '2020-05',
        bullets: ['Contributed code'],
      },
      {
        id: 'inv-2',
        visible: true,
        order: 1,
        organization: 'Non-Profit Org',
        role: 'Tech Lead',
        startDate: '2021-01',
        endDate: 'Present',
        bullets: ['Manage website'],
      },
      {
        id: 'inv-3',
        visible: true,
        order: 2,
        organization: 'Hackathon Group',
        role: 'Organizer',
        startDate: '2022-01',
        endDate: '2023-01',
        bullets: ['Ran events'],
      },
    ];

    it('sorts involvements reverse-chronologically with Present on top', () => {
      const sorted = sortInvolvementsByDate(sampleInvolvements);
      expect(sorted.map((i) => i.id)).toEqual(['inv-2', 'inv-3', 'inv-1']);
      expect(sorted.map((i) => i.order)).toEqual([0, 1, 2]);
    });

    it('breaks ties using startDate', () => {
      const tieInv: InvolvementItem[] = [
        {
          id: 'inv-a',
          visible: true,
          order: 0,
          organization: 'Org A',
          role: 'Volunteer',
          startDate: '2021-01',
          endDate: '2022-12',
          bullets: [],
        },
        {
          id: 'inv-b',
          visible: true,
          order: 1,
          organization: 'Org B',
          role: 'Volunteer',
          startDate: '2022-01',
          endDate: '2022-12',
          bullets: [],
        },
      ];

      const sorted = sortInvolvementsByDate(tieInv);
      expect(sorted[0].id).toBe('inv-b');
      expect(sorted[1].id).toBe('inv-a');
    });

    it('does not mutate original involvement items and renumbers order', () => {
      const copy = JSON.parse(JSON.stringify(sampleInvolvements));
      const sorted = sortInvolvementsByDate(sampleInvolvements);
      expect(sampleInvolvements).toEqual(copy);
      expect(sorted.map((i) => i.order)).toEqual([0, 1, 2]);
    });
  });

  describe('sortCertificationsByDate', () => {
    const sampleCerts: CertificationItem[] = [
      {
        id: 'cert-1',
        visible: true,
        order: 0,
        name: 'AWS Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2021-04',
        expirationDate: '2024-04',
      },
      {
        id: 'cert-2',
        visible: true,
        order: 1,
        name: 'CKA: Certified Kubernetes Administrator',
        issuer: 'CNCF',
        issueDate: '2023-08',
        expirationDate: '2026-08',
      },
      {
        id: 'cert-3',
        visible: true,
        order: 2,
        name: 'Google Cloud Professional Architect',
        issuer: 'Google',
        issueDate: '2020-01',
      },
    ];

    it('sorts certifications by issueDate descending', () => {
      const sorted = sortCertificationsByDate(sampleCerts);
      expect(sorted.map((c) => c.id)).toEqual(['cert-2', 'cert-1', 'cert-3']);
      expect(sorted.map((c) => c.order)).toEqual([0, 1, 2]);
    });

    it('breaks ties using expirationDate descending when issueDate is identical', () => {
      const tieCerts: CertificationItem[] = [
        {
          id: 'cert-shorter-validity',
          visible: true,
          order: 0,
          name: 'Cert A',
          issuer: 'Issuer A',
          issueDate: '2023-01',
          expirationDate: '2024-01',
        },
        {
          id: 'cert-longer-validity',
          visible: true,
          order: 1,
          name: 'Cert B',
          issuer: 'Issuer B',
          issueDate: '2023-01',
          expirationDate: '2026-01',
        },
      ];

      const sorted = sortCertificationsByDate(tieCerts);
      expect(sorted[0].id).toBe('cert-longer-validity');
      expect(sorted[1].id).toBe('cert-shorter-validity');
    });

    it('does not mutate original certification items and renumbers order', () => {
      const copy = JSON.parse(JSON.stringify(sampleCerts));
      const sorted = sortCertificationsByDate(sampleCerts);
      expect(sampleCerts).toEqual(copy);
      expect(sorted.map((c) => c.order)).toEqual([0, 1, 2]);
    });
  });

  describe('sortAwardsByDate', () => {
    const sampleAwards: AwardItem[] = [
      {
        id: 'award-1',
        visible: true,
        order: 0,
        title: 'Dean’s List',
        issuer: 'University',
        date: '2019-12',
      },
      {
        id: 'award-2',
        visible: true,
        order: 1,
        title: 'Hackathon 1st Place',
        issuer: 'Major Tech Hackathon',
        date: '2023-11',
      },
      {
        id: 'award-3',
        visible: true,
        order: 2,
        title: 'Employee of the Quarter',
        issuer: 'Company',
        date: '2021-06',
      },
    ];

    it('sorts awards by date descending and updates order', () => {
      const sorted = sortAwardsByDate(sampleAwards);
      expect(sorted.map((a) => a.id)).toEqual(['award-2', 'award-3', 'award-1']);
      expect(sorted.map((a) => a.order)).toEqual([0, 1, 2]);
    });

    it('handles awards with missing date strings by placing them last', () => {
      const awardsWithMissing: AwardItem[] = [
        {
          id: 'award-missing',
          visible: true,
          order: 0,
          title: 'Special Recognition',
          issuer: 'Org',
          date: '',
        },
        {
          id: 'award-valid',
          visible: true,
          order: 1,
          title: 'Honor Award',
          issuer: 'Org',
          date: '2022-05',
        },
      ];

      const sorted = sortAwardsByDate(awardsWithMissing);
      expect(sorted[0].id).toBe('award-valid');
      expect(sorted[1].id).toBe('award-missing');
      expect(sorted.map((a) => a.order)).toEqual([0, 1]);
    });

    it('does not mutate original award items and renumbers order', () => {
      const copy = JSON.parse(JSON.stringify(sampleAwards));
      const sorted = sortAwardsByDate(sampleAwards);
      expect(sampleAwards).toEqual(copy);
      expect(sorted.map((a) => a.order)).toEqual([0, 1, 2]);
    });
  });

  describe('sortPublicationsByDate', () => {
    const samplePubs: PublicationItem[] = [
      {
        id: 'pub-1',
        visible: true,
        order: 0,
        title: 'Deep Learning in ATS Optimization',
        publisher: 'IEEE',
        date: '2021-03',
        authors: ['John Doe'],
      },
      {
        id: 'pub-2',
        visible: true,
        order: 1,
        title: 'Next.js Scalable Architecture',
        publisher: 'ACM',
        date: '2024-02',
        authors: ['John Doe'],
      },
    ];

    it('sorts publications by date descending and updates order', () => {
      const sorted = sortPublicationsByDate(samplePubs);
      expect(sorted.map((p) => p.id)).toEqual(['pub-2', 'pub-1']);
      expect(sorted.map((p) => p.order)).toEqual([0, 1]);
    });

    it('does not mutate original publication items and renumbers order', () => {
      const copy = JSON.parse(JSON.stringify(samplePubs));
      const sorted = sortPublicationsByDate(samplePubs);
      expect(samplePubs).toEqual(copy);
      expect(sorted.map((p) => p.order)).toEqual([0, 1]);
    });
  });
});
