import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { UserProfile } from '../../core/models/api.types';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  profile: UserProfile = { id: 0, name: '', email: '' };
  password = '';
  loading = true;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.errorMessage = null;
    this.auth.getCurrentUser().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.error?.message ?? 'Failed to load profile.';
      },
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.errorMessage = null;
    this.successMessage = null;

    const update: Partial<Pick<UserProfile, 'name' | 'email'>> & { password?: string } = {
      name: this.profile.name,
      email: this.profile.email,
    };

    if (this.password.trim()) {
      update.password = this.password;
    }

    this.auth.updateProfile(update).subscribe({
      next: (updated) => {
        this.profile = updated;
        this.successMessage = 'Profile updated successfully.';
        this.password = '';
        this.saving = false;
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.error?.message ?? 'Failed to save profile.';
      },
    });
  }
}
