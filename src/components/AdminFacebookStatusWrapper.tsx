import { useAuth } from '../contexts/AuthContext';
import AdminFacebookStatus from './AdminFacebookStatus';

export default function AdminFacebookStatusWrapper() {
  const { user } = useAuth();

  if (user?.email !== 'ironzola@gmail.com') {
    return null;
  }

  return <AdminFacebookStatus />;
}
