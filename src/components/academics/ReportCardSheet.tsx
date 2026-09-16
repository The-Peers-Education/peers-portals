import Image from "next/image";
import { formatDate } from "@/lib/utils";
import type { ReportCard } from "@/types";

const TERM_STATUS_LABEL: Record<ReportCard["termStatus"], string> = {
  UPCOMING: "Upcoming",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function ReportCardSheet({ report }: { report: ReportCard }) {
  const termTitle = report.examTerm.title ?? report.examTerm.name;

  return (
    <article className="bg-white p-6 text-deep-navy print:p-0">
      <header className="flex items-start justify-between gap-4 border-b border-cloud pb-4">
        <div>
          <Image
            src="/logo.png"
            alt="The Peers Education System"
            width={180}
            height={48}
            className="h-12 w-auto object-contain"
          />
          <p className="mt-2 text-sm font-medium">{report.campus.name}</p>
          <p className="text-sm text-muted-foreground">{report.campus.code}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-lg font-semibold">Student report card</p>
          <p className="text-sm text-muted-foreground">{termTitle}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(report.examTerm.startDate)} – {formatDate(report.examTerm.endDate)}
          </p>
          <p className="mt-1 text-sm font-medium">{TERM_STATUS_LABEL[report.termStatus]}</p>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Student</dt>
          <dd className="font-medium">{report.student.fullName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Roll No</dt>
          <dd className="font-medium">{report.student.rollNumber}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Class / Section</dt>
          <dd className="font-medium">{report.student.classSection}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Term rank</dt>
          <dd className="font-medium">
            {report.rank ? `${report.rank} of ${report.cohortSize}` : "—"}
          </dd>
        </div>
      </dl>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-y border-cloud bg-paper text-left">
            <th className="px-3 py-2 font-medium">Subject</th>
            <th className="px-3 py-2 text-right font-medium">Marks</th>
            <th className="px-3 py-2 text-right font-medium">%</th>
            <th className="px-3 py-2 text-right font-medium">Grade</th>
            <th className="px-3 py-2 text-right font-medium">GPA</th>
          </tr>
        </thead>
        <tbody>
          {report.subjects.map((subject) => (
            <tr key={subject.subjectId} className="border-b border-cloud">
              <td className="px-3 py-2">{subject.name}</td>
              <td className="px-3 py-2 text-right">
                {subject.marksObtained} / {subject.totalMarks}
              </td>
              <td className="px-3 py-2 text-right">{subject.percentage.toFixed(1)}</td>
              <td className="px-3 py-2 text-right">{subject.letter}</td>
              <td className="px-3 py-2 text-right">{subject.gpa.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-medium">
            <td className="px-3 py-2">Total</td>
            <td className="px-3 py-2 text-right">
              {report.obtainedTotal} / {report.totalMarks}
            </td>
            <td className="px-3 py-2 text-right">{report.cumulativePercentage.toFixed(1)}</td>
            <td className="px-3 py-2 text-right">{report.letter}</td>
            <td className="px-3 py-2 text-right">{report.gpa.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="mt-5 grid grid-cols-4 gap-3 rounded-[10px] bg-paper px-4 py-3 text-sm">
        <div>
          <p className="text-muted-foreground">Percentage</p>
          <p className="font-display text-lg font-semibold">{report.cumulativePercentage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Letter</p>
          <p className="font-display text-lg font-semibold">{report.letter}</p>
        </div>
        <div>
          <p className="text-muted-foreground">GPA</p>
          <p className="font-display text-lg font-semibold">{report.gpa.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Result</p>
          <p className="font-display text-lg font-semibold">{report.resultStatus}</p>
        </div>
      </div>

      <footer className="mt-16 grid grid-cols-2 gap-10 text-sm">
        <div className="pt-10">
          <p className="border-t border-deep-navy pt-2 font-medium">Class teacher</p>
          <p className="text-muted-foreground">Signature &amp; date</p>
        </div>
        <div className="pt-10">
          <p className="border-t border-deep-navy pt-2 font-medium">Principal</p>
          <p className="text-muted-foreground">Signature &amp; stamp</p>
        </div>
      </footer>
    </article>
  );
}
