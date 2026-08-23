import { Link } from 'react-router-dom';

const YEAR = new Date().getFullYear();

/**
 * Sits under every signed-in screen. Its job is to make the two things people
 * hunt for reachable from anywhere: how the system is meant to be used, and who
 * to ask when it does not behave.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-wide flex-col gap-4 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-semibold text-ink">
            PSEMS — Project Scoring, Evaluation &amp; Management System
          </p>
          <p>Faculty of Engineering, University of Sri Jayewardenepura</p>
          <p className="text-ink-subtle">&copy; {YEAR}</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/guide" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
            How to use PSEMS
          </Link>
          <a
            href="https://eng.sjp.ac.lk"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink hover:underline"
          >
            Faculty website
          </a>
        </nav>
      </div>
    </footer>
  );
}
