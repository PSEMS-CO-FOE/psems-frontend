import { useParams } from 'react-router-dom';
import { CpiSubmissions } from './CpiSubmissions';

export function CpiSubmissionsPage() {
  const { cpiId = '' } = useParams();
  return <CpiSubmissions cpiId={cpiId} />;
}
