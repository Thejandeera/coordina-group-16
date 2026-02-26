import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../../frontend/src/components/Auth/Login';
import Signup from '../../frontend/src/components/Auth/Signup';

describe('User Management: Frontend Components', () => {

    describe('Login Component', () => {
        it('should render the login form correctly', () => {
            render(<Login />);
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInReports();
            expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
        });

        it('should show error message on empty submission', async () => {
            render(<Login />);
            fireEvent.click(screen.getByRole('button', { name: /login/i }));
            expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
            expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
        });
    });

    describe('Signup Component', () => {
        it('should render the signup form correctly', () => {
            render(<Signup />);
            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/profile photo/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
        });

        it('should show error if passwords do not match', async () => {
            render(<Signup />);

            fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Pass123!' } });
            fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Pass456!' } });

            fireEvent.click(screen.getByRole('button', { name: /register/i }));

            expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
        });

        it('should call register service with valid details', async () => {
            const mockAuthService = {
                register: vi.fn().mockResolvedValue({ success: true })
            };

            render(<Signup authService={mockAuthService} />);

            fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New User' } });
            fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
            fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '0771234567' } });

            // Mocking file upload
            const file = new File(['hello'], 'profile.png', { type: 'image/png' });
            fireEvent.change(screen.getByLabelText(/profile photo/i), { target: { files: [file] } });

            fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123!' } });
            fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123!' } });

            fireEvent.click(screen.getByRole('button', { name: /register/i }));

            expect(mockAuthService.register).toHaveBeenCalledWith(expect.objectContaining({
                fullName: 'New User',
                email: 'new@example.com',
                phoneNumber: '0771234567'
            }));
        });
    });
});
