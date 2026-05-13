import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerAPI } from '../../api/auth.api';
import AuthLayout from '../../components/common/AuthLayout';
import AuthCard from '../../components/common/AuthCard';
import FormInput from '../../components/common/FormInput';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingButton from '../../components/common/LoadingButton';
import AuthRedirect from '../../components/common/AuthRedirect';

function SignUpPage() {
	const navigate = useNavigate();
	const [error, setError] = useState('');
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: '',
			email: '',
			password: '',
		},
	});

	const onSubmit = async (values) => {
		setError('');
		try {
			await registerAPI({
				name: values.name.trim(),
				email: values.email.trim(),
				password: values.password,
			});
			navigate('/login');
		} catch (err) {
			const message = err?.response?.data?.message || 'Signup failed. Try again.';
			setError(message);
		}
	};

	return (
		<AuthLayout
			eyebrow="Get started"
			title="Create your account"
			description="Join the learning platform and track your progress from day one."
		>
			<AuthCard title="Sign up" subtitle="Fill in your details.">
				<form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
					<FormInput
						id="name"
						label="Name"
						type="text"
						autoComplete="name"
						registerProps={register('name', {
							required: 'Name is required',
						})}
						error={errors.name?.message}
					/>
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
						autoComplete="new-password"
						registerProps={register('password', {
							required: 'Password is required',
							minLength: {
								value: 8,
								message: 'Password must be at least 8 characters',
							},
						})}
						error={errors.password?.message}
					/>
					<ErrorAlert message={error} />
					<LoadingButton
						isLoading={isSubmitting}
						loadingText="Creating account..."
						idleText="Create account"
					/>
				</form>
				<AuthRedirect
					text="Already have an account?"
					linkText="Sign in"
					to="/login"
				/>
			</AuthCard>
		</AuthLayout>
	);
}

export default SignUpPage;
