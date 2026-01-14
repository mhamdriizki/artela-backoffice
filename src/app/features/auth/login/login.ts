import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
// Dependency Injection gaya baru (Angular 16+)
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  isLoading = false;
  errorMessage = '';

  // Form Definition
  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    // Panggil Service Login
    this.auth.login(this.form.value).subscribe({
      next: () => {
        // Redirect sudah dihandle di service (tap -> navigate)
        // Tapi kita set loading false utk safety
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Username atau Password salah!';
        this.isLoading = false;
      }
    });
  }
}
