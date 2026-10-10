import { Redirect } from 'expo-router';
import { useApp } from '../stores/app';
export default function Index() { const { data } = useApp(); return <Redirect href={data.profile ? '/(tabs)' : '/onboarding'} />; }
