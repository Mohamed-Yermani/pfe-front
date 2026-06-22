
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { GeminiService } from '../../../../core/services/gemini.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-content-creator',
  standalone: true,
  templateUrl: './content-creator.component.html',
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentCreatorComponent {
  private readonly geminiService = inject(GeminiService);

  promptControl = new FormControl('', [Validators.required, Validators.minLength(5)]);
  generatedContent = signal<string | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  async generateContent(): Promise<void> {
    if (this.promptControl.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.generatedContent.set(null);
    this.error.set(null);

    try {
      const prompt = this.promptControl.value ?? '';
      const result = await this.geminiService.generateText(prompt);
      this.generatedContent.set(result);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      this.error.set(errorMessage);
    } finally {
      this.isLoading.set(false);
    }
  }
}