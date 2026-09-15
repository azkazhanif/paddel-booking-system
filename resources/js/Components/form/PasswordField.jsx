import PasswordStrength from '@/Components/form/PasswordStrength';
import TextField from '@/Components/form/TextField';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';

export default function PasswordField({ showStrength = false, value, ...props }) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="flex flex-col gap-2.5">
            <TextField
                type={visible ? 'text' : 'password'}
                icon={Lock}
                value={value}
                trailing={
                    <button
                        type="button"
                        onClick={() => setVisible(!visible)}
                        className="grid size-9 place-items-center rounded-full text-bone-50/50 transition-colors hover:bg-white/10 hover:text-bone-50"
                        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
                        aria-pressed={visible}
                    >
                        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                }
                {...props}
            />
            {showStrength && <PasswordStrength password={value} />}
        </div>
    );
}
