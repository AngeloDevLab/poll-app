import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LegalLinks } from '../../shared/legal-links/legal-links';

/**
 * Legal notice with the operator's contact details and the terms of use.
 */
@Component({
  selector: 'app-imprint',
  imports: [LegalLinks, RouterLink],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss',
})
export class Imprint {}
