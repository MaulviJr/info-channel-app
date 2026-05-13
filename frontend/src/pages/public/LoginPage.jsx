import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/common/AuthLayout';
import AuthCard from '../../components/common/AuthCard';
import FormInput from '../../components/common/FormInput';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingButton from '../../components/common/LoadingButton';
import AuthRedirect from '../../components/common/AuthRedirect';

function LoginPage() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [error, setError] = useState('');
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (values) => {
		setError('');
		try {
			await login({
				email: values.email.trim(),
				password: values.password,
			});
			navigate('/student');
		} catch (err) {
			const message = err?.response?.data?.message || 'Login failed. Try again.';
			setError(message);
		}
	};

	return (
		<AuthLayout
			eyebrow="Welcome back"
			title="Sign in to continue"
			description="Access your courses, update your profile, and stay on track with your learning."
		>
			<AuthCard title="Login" subtitle="Enter your account credentials.">
				<form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<FormInput
						id="email"
						label="Email"
						type="email"
						autoComplete="email"
						registerProps={register('email', {
							required: 'Email is required',
						})}
						error={errors.email?.message}
					/>
					<FormInput
						id="password"
						label="Password"
						type="password"
						autoComplete="current-password"
						registerProps={register('password', {
							required: 'Password is required',
						})}
						error={errors.password?.message}
					/>
					<ErrorAlert message={error} />
					<LoadingButton
						isLoading={isSubmitting}
						loadingText="Signing in..."
						idleText="Sign in"
					/>
				</form>
				<AuthRedirect
					text="No account yet?"
					linkText="Create one"
					to="/signup"
				/>
			</AuthCard>
		</AuthLayout>
	);
}

export default LoginPage;
