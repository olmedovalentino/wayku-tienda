'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session) {
            router.push('/admin/dashboard');
        } else {
            router.push('/admin/login');
        }
    }, [router]);

    return null;
}
