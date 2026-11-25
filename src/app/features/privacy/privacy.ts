import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalLinks } from '../../shared/legal-links/legal-links';

/**
 * Privacy policy that lists which data the app processes and why.
 */
@Component({
  selector: 'app-privacy',
  imports: [LegalLinks, RouterLink],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class Privacy {}
