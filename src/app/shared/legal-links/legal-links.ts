import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Links to the imprint and the privacy policy at the bottom of a page.
 */
@Component({
  selector: 'app-legal-links',
  imports: [RouterLink],
  templateUrl: './legal-links.html',
  styleUrl: './legal-links.scss',
})
export class LegalLinks {}
