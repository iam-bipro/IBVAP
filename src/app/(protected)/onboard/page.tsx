"use client";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const Onboard = () => {
  const supabase = createClient();
  const router = useRouter();
  const getOnboard = async () => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        onboard: true,
      },
    });

    if (error) {
      console.error(error);
    }
    router.replace("/dashboard");
    router.refresh();
  }
  return (
    <div>
      <button onClick={getOnboard} className="cursor-pointer">Onboard</button>
    </div>
  )
}

export default Onboard
